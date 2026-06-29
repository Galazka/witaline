import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import { USD_TO_PLN, TWILIO_POLAND_MOBILE_COST_PER_MIN_PLN, AI_CALL_COST_PER_MIN_PLN } from "@/lib/cost-rates";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

interface SyncStats {
  total: number;
  elevenlabs: number;
  twilio: number;
  errors: number;
  skipped: number;
}

export async function POST() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const stats: SyncStats = { total: 0, elevenlabs: 0, twilio: 0, errors: 0, skipped: 0 };

  let twilioAccountCurrency = "PLN";
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    try {
      const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
      const accRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}.json`,
        { headers: { "Authorization": `Basic ${auth}` } }
      );
      if (accRes.ok) {
        const accData = await accRes.json() as Record<string, unknown>;
        twilioAccountCurrency = (accData.currency as string) || "PLN";
      }
    } catch { /* use PLN fallback */ }
  }

  // Find records where individual costs haven't been synced from APIs.
  // Query: total_cost missing/zero OR ElevenLabs cost not fetched OR Twilio cost not fetched.
  // Scope to last 90 days to avoid re-processing ancient records.
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const { data: callLogs } = await supabaseAdmin
    .from("call_logs")
    .select("id, business_id, elevenlabs_conversation_id, twilio_call_sid, cost_elevenlabs, cost_twilio, cost_openrouter, total_cost, revenue_pln, cost_pln, internal_cost_pln, duration_seconds, created_at, routed_to_extension, consultant_transfer_cost_pln")
    .or("total_cost.is.null,total_cost.eq.0,cost_elevenlabs.is.null,cost_elevenlabs.eq.0,cost_twilio.is.null,cost_twilio.eq.0")
    .is("deleted_at", null)
    .gte("created_at", ninetyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (!callLogs || callLogs.length === 0) {
    return NextResponse.json({ message: "Brak rozmów do synchronizacji", stats });
  }

  stats.total = callLogs.length;

  const concurrency = 5;
  const chunks: typeof callLogs[] = [];
  for (let i = 0; i < callLogs.length; i += concurrency) {
    chunks.push(callLogs.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(async (log) => {
        const updates: Record<string, unknown> = {};

        // 1. ElevenLabs cost
        if (ELEVENLABS_API_KEY && log.elevenlabs_conversation_id) {
          try {
            const res = await fetch(
              `https://api.elevenlabs.io/v1/convai/conversations/${log.elevenlabs_conversation_id}`,
              { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
            );
            if (res.ok) {
              const data = await res.json() as Record<string, unknown>;
              const meta = data.metadata as Record<string, unknown> | undefined;
              const charging = meta?.charging as Record<string, unknown> | undefined;

              if (charging) {
                const llmCharge = Number(charging.llm_charge) || 0;
                const callCharge = Number(charging.call_charge) || 0;
                const totalCharge = llmCharge + callCharge;

                if (totalCharge > 0) {
                  updates.cost_elevenlabs = Math.round(totalCharge * USD_TO_PLN * 100000) / 100000;
                  stats.elevenlabs++;
                }
              }
            }
          } catch (e) {
            console.warn(`[sync-costs] ElevenLabs fetch error for ${log.elevenlabs_conversation_id}:`, e);
            stats.errors++;
          }
        }

        // 2. Twilio cost (convert to PLN if account currency is USD)
        if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && log.twilio_call_sid) {
          try {
            const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
            const res = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls/${log.twilio_call_sid}.json`,
              { headers: { "Authorization": `Basic ${auth}` } }
            );
            if (res.ok) {
              const data = await res.json() as Record<string, unknown>;
              const price = Number(data.price) || 0;
              if (price !== 0 || data.price !== undefined) {
                const absPrice = Math.abs(price);
                updates.cost_twilio = Math.round(
                  twilioAccountCurrency === "USD"
                    ? absPrice * USD_TO_PLN
                    : absPrice
                );
                stats.twilio++;
              }
            }
          } catch (e) {
            console.warn(`[sync-costs] Twilio fetch error for ${log.twilio_call_sid}:`, e);
            stats.errors++;
          }
        }

        // Consultant transfer cost (only if not already tracked)
        const durationMin = (log.duration_seconds || 0) / 60;
        const consultantTransferCost = (!log.consultant_transfer_cost_pln && log.routed_to_extension)
          ? Math.round(durationMin * TWILIO_POLAND_MOBILE_COST_PER_MIN_PLN * 100000) / 100000
          : 0;

        // 3. Always calculate total_cost and revenue_pln
        const uEL = updates.cost_elevenlabs;
        const uTW = updates.cost_twilio;
        const currentElevenlabs = Number(uEL !== undefined ? uEL : log.cost_elevenlabs) || 0;
        const currentTwilio = Number(uTW !== undefined ? uTW : log.cost_twilio) || 0;
        const currentOpenrouter = Number(log.cost_openrouter) || 0;
        const currentConsultant = Number(log.consultant_transfer_cost_pln) || 0;
        const calcTotalCost = Math.round((currentElevenlabs + currentTwilio + currentOpenrouter + currentConsultant + consultantTransferCost) * 100000) / 100000;

        updates.total_cost = calcTotalCost;
        updates.internal_cost_pln = calcTotalCost;
        if (consultantTransferCost > 0) {
          updates.consultant_transfer_cost_pln = consultantTransferCost;
        }

        // Set revenue_pln = cost_pln for non-main-line businesses (what client was charged)
        const isMainLine = log.business_id === "00000000-0000-0000-0000-000000000001";
        const currentRevenue = Number(log.revenue_pln) || 0;
        if (currentRevenue === 0 && !isMainLine) {
          const chargedPln = Number(log.cost_pln) || 0;
          if (chargedPln > 0) {
            updates.revenue_pln = chargedPln;
          }
        }

        const { error: updateError } = await supabaseAdmin
          .from("call_logs")
          .update(updates)
          .eq("id", log.id);

        if (updateError) {
          console.warn(`[sync-costs] DB update error for ${log.id}:`, updateError.message);
          stats.errors++;
        }
      })
    );

    for (const r of results) {
      if (r.status === "rejected") stats.errors++;
    }
  }

  return NextResponse.json({
    message: `Zsynchronizowano: ${stats.elevenlabs} ElevenLabs, ${stats.twilio} Twilio (${stats.skipped} pominięto, ${stats.errors} błędów)`,
    stats,
  });
}
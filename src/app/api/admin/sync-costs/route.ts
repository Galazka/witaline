import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import { USD_TO_PLN, TWILIO_POLAND_MOBILE_COST_PER_MIN_PLN, AI_CALL_COST_PER_MIN_PLN } from "@/lib/cost-rates";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

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

  // Process ALL call_logs (not just unsynced) within scope to recalculate costs.
  // Also fetch recent ElevenLabs conversations missing from call_logs.
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  let { data: callLogs } = await supabaseAdmin
    .from("call_logs")
    .select("id, business_id, elevenlabs_conversation_id, twilio_call_sid, cost_elevenlabs, cost_twilio, cost_openrouter, total_cost, revenue_pln, cost_pln, internal_cost_pln, duration_seconds, created_at, routed_to_extension, from_number")
    .is("deleted_at", null)
    .gte("created_at", oneYearAgo.toISOString())
    .order("created_at", { ascending: false });

  // Fetch recent ElevenLabs conversations not yet in call_logs
  let fetchedFromEL = 0;
  if (ELEVENLABS_API_KEY) {
    try {
      const elRes = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${process.env.ELEVENLABS_AGENT_ID}&page_size=200&sort=start_time&order=desc`,
        { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
      );
      if (elRes.ok) {
        const elData = await elRes.json() as { conversations?: Array<Record<string, unknown>> };
        const existingConvIds = new Set((callLogs || []).map(c => c.elevenlabs_conversation_id).filter(Boolean));
        for (const conv of (elData.conversations || [])) {
          const convId = conv.conversation_id as string;
          if (convId && !existingConvIds.has(convId)) {
            await supabaseAdmin.from("call_logs").insert({
              elevenlabs_conversation_id: convId,
              business_id: WITALINE_MAIN_BUSINESS_ID,
              from_number: (conv.caller_id as string) || "",
              to_number: (conv.phone_number as Record<string, unknown>)?.phone_number as string || "",
              created_at: conv.start_time as string || new Date().toISOString(),
              duration_seconds: Math.round(((conv.call_duration_seconds as number) || 0)),
            }).select().single().catch(() => {});
            fetchedFromEL++;
          }
        }
      }
    } catch (e) {
      console.warn("[sync-costs] ElevenLabs conversation fetch error:", e);
    }
  }

  // Re-query after adding new rows
  const { data: refreshedLogs } = await supabaseAdmin
    .from("call_logs")
    .select("id, business_id, elevenlabs_conversation_id, twilio_call_sid, cost_elevenlabs, cost_twilio, cost_openrouter, total_cost, revenue_pln, cost_pln, internal_cost_pln, duration_seconds, created_at, routed_to_extension, from_number")
    .is("deleted_at", null)
    .gte("created_at", oneYearAgo.toISOString())
    .order("created_at", { ascending: false });

  if (!refreshedLogs || refreshedLogs.length === 0) {
    return NextResponse.json({
      message: "Brak rozmów do synchronizacji (baza call_logs pusta)",
      stats,
      db_total: 0,
    });
  }

  callLogs = refreshedLogs;
  stats.total = callLogs.length;

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

        // Consultant transfer cost (only if call was transferred)
        const durationMin = (log.duration_seconds || 0) / 60;
        const consultantTransferCost = log.routed_to_extension
          ? Math.round(durationMin * TWILIO_POLAND_MOBILE_COST_PER_MIN_PLN * 100000) / 100000
          : 0;

        // 3. Always calculate total_cost and revenue_pln
        const uEL = updates.cost_elevenlabs;
        const uTW = updates.cost_twilio;
        const currentElevenlabs = Number(uEL !== undefined ? uEL : log.cost_elevenlabs) || 0;
        const currentTwilio = Number(uTW !== undefined ? uTW : log.cost_twilio) || 0;
        const currentOpenrouter = Number(log.cost_openrouter) || 0;
        const currentConsultant = 0;
        const calcTotalCost = Math.round((currentElevenlabs + currentTwilio + currentOpenrouter + currentConsultant + consultantTransferCost) * 100000) / 100000;

        updates.total_cost = calcTotalCost;
        updates.internal_cost_pln = calcTotalCost;

        // Set revenue_pln = cost_pln for non-main-line businesses (what client was charged)
        const isMainLine = log.business_id === WITALINE_MAIN_BUSINESS_ID;
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
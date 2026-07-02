import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import { USD_TO_PLN, TWILIO_POLAND_MOBILE_COST_PER_MIN_USD } from "@/lib/cost-rates";
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

let debugSample: Record<string, unknown> | null = null;

export async function POST() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const stats: SyncStats = { total: 0, elevenlabs: 0, twilio: 0, errors: 0, skipped: 0 };

  let twilioAccountCurrency = "USD";
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    try {
      const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
      const accRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}.json`,
        { headers: { "Authorization": `Basic ${auth}` } }
      );
      if (accRes.ok) {
        const accData = await accRes.json() as Record<string, unknown>;
        twilioAccountCurrency = (accData.currency as string) || "USD";
      }
    } catch { /* use USD fallback */ }
  }

  // Helper: round to N decimal places
  const roundTo = (n: number, decimals = 4) => Math.round(n * 10 ** decimals) / 10 ** decimals;

  // Process ALL call_logs (not just unsynced) within scope to recalculate costs.
  // Also fetch recent ElevenLabs conversations missing from call_logs.
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  let { data: callLogs } = await supabaseAdmin
    .from("call_logs")
    .select("id, business_id, elevenlabs_conversation_id, twilio_call_sid, cost_elevenlabs, cost_twilio, cost_openrouter, total_cost, revenue_pln, cost_pln, duration_seconds, created_at, routed_to_extension, from_number")
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
    .select("id, business_id, elevenlabs_conversation_id, twilio_call_sid, cost_elevenlabs, cost_twilio, cost_openrouter, total_cost, revenue_pln, cost_pln, duration_seconds, created_at, routed_to_extension, from_number")
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

              // ElevenLabs API returns dollar-denominated prices directly:
              //   charging.llm_price     — LLM usage cost in USD (float)
              //   charging.platform_price — Platform/call cost in USD (float)
              //   (charging.llm_charge / call_charge / platform_charge are integer credits)
              const llmPrice = Number(charging?.llm_price) || 0;
              const platformPrice = Number(charging?.platform_price) || 0;
              const elevenLabsCostUsd = llmPrice + platformPrice;

              // Collect diagnostic sample from first conversation
              if (!debugSample) {
                debugSample = {
                  conversation_id: log.elevenlabs_conversation_id,
                  duration_seconds: log.duration_seconds,
                  llm_price: charging?.llm_price,
                  platform_price: charging?.platform_price,
                  llm_charge: charging?.llm_charge,
                  call_charge: charging?.call_charge,
                  platform_charge: charging?.platform_charge,
                  elevenLabsCostUsd,
                };
              }

              // Log raw data for debugging
              if (stats.elevenlabs < 3) {
                console.log("[sync-costs-debug] conv", log.elevenlabs_conversation_id, {
                  llm_price: charging?.llm_price,
                  platform_price: charging?.platform_price,
                  llm_charge: charging?.llm_charge,
                  call_charge: charging?.call_charge,
                  platform_charge: charging?.platform_charge,
                });
              }

              if (elevenLabsCostUsd > 0) {
                updates.cost_elevenlabs = roundTo(elevenLabsCostUsd);
                stats.elevenlabs++;
              }
              // If API returned null charging data, mark as needing estimation
              else if (charging?.llm_price === null || charging?.llm_price === undefined) {
                stats.skipped++;
              }
            }
          } catch (e) {
            console.warn(`[sync-costs] ElevenLabs fetch error for ${log.elevenlabs_conversation_id}:`, e);
            stats.errors++;
          }
        }

        // 2. Twilio cost — store in USD
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
                // Twilio returns price in account currency. Convert to USD if needed.
                updates.cost_twilio = roundTo(
                  twilioAccountCurrency === "PLN"
                    ? absPrice / USD_TO_PLN
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

        // Consultant transfer cost (only if call was transferred) — stored in USD
        const durationMin = (log.duration_seconds || 0) / 60;
        const consultantTransferCost = log.routed_to_extension
          ? roundTo(durationMin * TWILIO_POLAND_MOBILE_COST_PER_MIN_USD)
          : 0;

        // 3. Always calculate total_cost and revenue_pln
        const uEL = updates.cost_elevenlabs;
        const uTW = updates.cost_twilio;
        const currentElevenlabs = Number(uEL !== undefined ? uEL : log.cost_elevenlabs) || 0;
        const currentTwilio = Number(uTW !== undefined ? uTW : log.cost_twilio) || 0;
        const currentOpenrouter = Number(log.cost_openrouter) || 0;
        const currentConsultant = 0;
        const calcTotalCost = roundTo(currentElevenlabs + currentTwilio + currentOpenrouter + currentConsultant + consultantTransferCost);

        updates.total_cost = calcTotalCost;

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

  // Post-sync: estimate costs for conversations without actual ElevenLabs data
  // Calculate average cost-per-minute from conversations WITH actual data
  const { data: logsWithCosts } = await supabaseAdmin
    .from("call_logs")
    .select("cost_elevenlabs, duration_seconds")
    .is("deleted_at", null)
    .not("cost_elevenlabs", "is", null)
    .gt("cost_elevenlabs", 0)
    .gt("duration_seconds", 0)
    .gte("created_at", oneYearAgo.toISOString());

  let avgCostPerMinUsd = 0.04; // conservative default
  if (logsWithCosts && logsWithCosts.length > 5) {
    const totalCostUsd = logsWithCosts.reduce((s, l) => s + (Number(l.cost_elevenlabs) || 0), 0);
    const totalMinutes = logsWithCosts.reduce((s, l) => s + ((Number(l.duration_seconds) || 0) / 60), 0);
    if (totalMinutes > 0) avgCostPerMinUsd = totalCostUsd / totalMinutes;
  }

  // Estimate costs for conversations still missing ElevenLabs cost (NULL or 0)
  const { data: logsNeedEstimate } = await supabaseAdmin
    .from("call_logs")
    .select("id, duration_seconds, cost_elevenlabs")
    .is("deleted_at", null)
    .or("cost_elevenlabs.is.null,cost_elevenlabs.eq.0")
    .gte("created_at", oneYearAgo.toISOString());

  let estimated = 0;
  for (const log of logsNeedEstimate || []) {
    const minutes = (Number(log.duration_seconds) || 0) / 60;
    if (minutes > 0) {
      const estCost = roundTo(minutes * avgCostPerMinUsd);
      await supabaseAdmin
        .from("call_logs")
        .update({ cost_elevenlabs: estCost })
        .eq("id", log.id);
      estimated++;
    }
  }

  // Final pass: recalculate total_cost for ALL logs in scope from individual components
  // This fixes old inflated total_cost values from when fallback rates were used
  const { data: allLogs } = await supabaseAdmin
    .from("call_logs")
    .select("id, cost_elevenlabs, cost_twilio, cost_openrouter, cost_pln")
    .is("deleted_at", null)
    .gte("created_at", oneYearAgo.toISOString());

  let recalculated = 0;
  const concurrency2 = 10;
  const chunks2: typeof allLogs[] = [];
  for (let i = 0; i < (allLogs || []).length; i += concurrency2) {
    chunks2.push((allLogs || []).slice(i, i + concurrency2));
  }
  for (const chunk of chunks2) {
    await Promise.allSettled(chunk.map(async (log) => {
      const el = Number(log.cost_elevenlabs) || 0;
      const tw = Number(log.cost_twilio) || 0;
      const or_ = Number(log.cost_openrouter) || 0;
      const newTotal = roundTo(el + tw + or_);
      const oldTotal = Number(log.cost_pln) || 0;
      // Only update if different (avoid unnecessary writes)
      if (Math.abs(newTotal - oldTotal) > 0.0001) {
        await supabaseAdmin
          .from("call_logs")
          .update({ total_cost: newTotal })
          .eq("id", log.id);
        recalculated++;
      }
    }));
  }

  return NextResponse.json({
    message: `Zsynchronizowano: ${stats.elevenlabs} EL, ${stats.twilio} TW, ${estimated} oszacowano, ${recalculated} przeliczono total_cost (avg ${avgCostPerMinUsd.toFixed(4)} $/min)`,
    stats,
    debug_first_conv: debugSample,
    avg_cost_per_min_usd: avgCostPerMinUsd,
    estimated_count: estimated,
    recalculated_count: recalculated,
  });
}
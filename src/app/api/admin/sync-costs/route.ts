import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

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

  // Sync ALL records that haven't been synced yet
  // (cost_elevenlabs = 0 and has conversation_id, OR cost_twilio = 0 and has twilio_call_sid)
  // Also re-sync records where cost is suspiciously low
  const { data: callLogs } = await supabaseAdmin
    .from("call_logs")
    .select("id, conversation_id, twilio_call_sid, cost_elevenlabs, cost_twilio, duration_seconds, created_at")
    .or("cost_elevenlabs.is.null,cost_elevenlabs.eq.0,cost_twilio.is.null,cost_twilio.eq.0")
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
        if (ELEVENLABS_API_KEY && log.conversation_id) {
          try {
            const res = await fetch(
              `https://api.elevenlabs.io/v1/convai/conversations/${log.conversation_id}`,
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
                  updates.cost_elevenlabs = Math.round(totalCharge * 100000) / 100000;
                  stats.elevenlabs++;
                }
              }
            }
          } catch (e) {
            console.warn(`[sync-costs] ElevenLabs fetch error for ${log.conversation_id}:`, e);
            stats.errors++;
          }
        }

        // 2. Twilio cost
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
                updates.cost_twilio = Math.round(Math.abs(price) * 100000) / 100000;
                stats.twilio++;
              }
            }
          } catch (e) {
            console.warn(`[sync-costs] Twilio fetch error for ${log.twilio_call_sid}:`, e);
            stats.errors++;
          }
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from("call_logs")
            .update(updates)
            .eq("id", log.id);

          if (updateError) {
            console.warn(`[sync-costs] DB update error for ${log.id}:`, updateError.message);
            stats.errors++;
          }
        } else {
          stats.skipped++;
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
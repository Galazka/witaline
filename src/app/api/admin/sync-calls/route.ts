import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import { calculateCost, getPlanConfig } from "@/lib/pricing";
import type { PlanKey } from "@/types/database";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1/convai";
const WITALINE_MAIN_BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

type Classification = "spam" | "offer" | "order" | "question" | "booking" | "unknown";

function classifyCall(summary: string, transcript: string): Classification {
  const text = `${summary} ${transcript}`.toLowerCase();
  if (/\b(reklama|spam|sprzeda|oferta komerc|nie interes|pomylka|wrong number)\b/.test(text)) return "spam";
  if (/\b(zamow|zamowie|chce kupic|poprosze|rezerw|umow|wizyt|termin|booking|order|chcialbym zamowic)\b/.test(text)) return "order";
  if (/\b(cena|ile kosztuje|promoc|znizk|pakiet|start|growth|enterprise|abonament|platnos|faktur|za ile|drogo|tanio)\b/.test(text)) return "offer";
  if (/\b(pytanie|pytam|chcialem zapytac|inform|jak dziala|czy moge|help|porad|dlaczego|gdzie|kiedy|jak|co to)\b/.test(text)) return "question";
  return "unknown";
}

async function fetchConversationsPage(apiKey: string, agentId: string, cursor?: string) {
  const params = new URLSearchParams({ agent_id: agentId, page_size: "100" });
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`${ELEVENLABS_API}/conversations?${params}`, {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) throw new Error(`ElevenLabs API error: ${res.status}`);
  return res.json();
}

async function fetchConversationDetail(apiKey: string, convId: string) {
  const res = await fetch(`${ELEVENLABS_API}/conversations/${convId}`, {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY or AGENT_ID not configured" }, { status: 500 });
  }

  // Collect existing ElevenLabs conversation IDs for dedup
  const { data: existingLogs } = await supabaseAdmin
    .from("call_logs")
    .select("elevenlabs_conversation_id");

  const existingConvIds = new Set(
    (existingLogs || [])
      .map((l) => l.elevenlabs_conversation_id)
      .filter(Boolean)
  );

  let cursor: string | undefined;
  let page = 0;
  let saved = 0;
  let skipped = 0;

  while (page < 10) {
    page++;
    const data = await fetchConversationsPage(apiKey, agentId, cursor);

    const conversations: Array<Record<string, unknown>> = data.conversations || [];
    if (conversations.length === 0) break;

    for (const conv of conversations) {
      const convId = conv.conversation_id as string;
      if (!convId) continue;

      if (existingConvIds.has(convId)) {
        skipped++;
        continue;
      }

      const detail = await fetchConversationDetail(apiKey, convId);
      if (!detail) continue;

      const duration = (detail.duration_seconds as number) || (detail.metadata as Record<string, unknown>)?.call_duration_secs as number || 0;
      const analysis = (detail.analysis as Record<string, unknown>) || {};
      const metadata = (detail.metadata as Record<string, unknown>) || {};
      const dynVars = ((detail.conversation_initiation_client_data as Record<string, unknown>)?.dynamic_variables as Record<string, unknown>) || {};
      const phoneData = (metadata.phone_call as Record<string, unknown>) || {};
      const callNumber = phoneData.external_number as string || (conv.caller_id as string) || (conv.caller_number as string) || "";
      const agentNumber = phoneData.agent_number as string || "";
      const rawTranscript = detail.transcript as Array<Record<string, unknown>> | undefined;
      const transcriptText = rawTranscript
        ? rawTranscript.map((t: Record<string, unknown>) => `[${t.role}] ${t.message}`).join("\n")
        : "";
      const summary = (analysis.transcript_summary as string) || "";

      let businessId = (dynVars.businessId as string) || "";
      if (!businessId && agentNumber) {
        const { data: biz } = await supabaseAdmin
          .from("businesses")
          .select("id")
          .eq("twilio_number", agentNumber)
          .maybeSingle();
        if (biz) businessId = biz.id;
      }
      if (!businessId) businessId = WITALINE_MAIN_BUSINESS_ID;

      const isMainLine = businessId === WITALINE_MAIN_BUSINESS_ID;
      const classification = classifyCall(summary, transcriptText);

      // Główna linia WitaLine: stawka wewnętrzna 0,38 PLN/min
      // Biznesy klienckie: ich stawka z planu
      let costPln: number;
      if (isMainLine) {
        const tokens = Math.ceil((duration / 60) * 1000);
        costPln = Math.round(tokens * 0.00038 * 100) / 100;
      } else {
        const { data: biz } = await supabaseAdmin.from("businesses").select("current_plan").eq("id", businessId).single();
        let totalMonthlyMinutes: number | undefined;
        if (biz?.current_plan?.startsWith("elastic")) {
          const monthStart = new Date();
          monthStart.setDate(1); monthStart.setHours(0,0,0,0);
          const { data: monthlyLogs } = await supabaseAdmin.from("call_logs").select("duration_seconds").eq("business_id", businessId).gte("created_at", monthStart.toISOString());
          totalMonthlyMinutes = ((monthlyLogs || []).reduce((s, l) => s + (l.duration_seconds || 0), 0) + (duration || 0)) / 60;
        }
        costPln = biz ? calculateCost(duration, biz.current_plan as PlanKey, totalMonthlyMinutes) : 0;
      }

      const { data: callLog } = await supabaseAdmin
        .from("call_logs")
        .insert({
          business_id: businessId,
          elevenlabs_conversation_id: convId,
          duration_seconds: duration,
          cost_pln: costPln,
          internal_cost_pln: costPln,
          caller_id: callNumber || "unknown",
          from_number: callNumber || "",
          twilio_call_sid: (metadata.twilio_call_sid as string) || "",
          routed_from_main: !!(dynVars.routed_from_main),
          transcript: transcriptText || "",
          classification,
          ai_summary: summary || "",
          was_helpful: null,
          recording_url: (detail.recording_url as string) || "",
          ended_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (callLog) {
        await supabaseAdmin.from("conversations").insert({
          business_id: businessId,
          channel: "voice",
          status: "ended",
          caller_id: callNumber || "unknown",
          caller_name: null,
          summary: summary || "",
          duration_seconds: duration || 0,
          message_count: transcriptText ? transcriptText.split("\n").length : 1,
          started_at: new Date(Date.now() - (duration || 0) * 1000).toISOString(),
          ended_at: new Date().toISOString(),
        });

        if (!isMainLine) {
          const minutesToAdd = Math.ceil(duration / 60);
          const { data: biz } = await supabaseAdmin.from("businesses").select("minutes_used_this_week").eq("id", businessId).maybeSingle();
          if (biz) {
            await supabaseAdmin.from("businesses").update({ minutes_used_this_week: (biz.minutes_used_this_week || 0) + minutesToAdd }).eq("id", businessId);
          }
        }
      }

      saved++;
      existingConvIds.add(convId);
    }

    cursor = data.next_cursor as string | undefined;
    if (!cursor || !data.has_more) break;
  }

  return NextResponse.json({ saved, skipped, pages: page });
}

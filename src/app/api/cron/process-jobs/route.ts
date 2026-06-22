import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { processJobQueue } from "@/lib/job-queue";
import { sendSms } from "@/lib/twilio-sms";
import { sendWhatsApp } from "@/lib/twilio-whatsapp";
import { sendWebhook } from "@/lib/webhook-outbound";
import { calculateCost } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function handleJobMain(p: Record<string, unknown>): Promise<void> {
  const metadata = (p.metadata as Record<string, unknown>) || {};
  const customData = (p.customData as Record<string, unknown>) || {};
  const businessId = String(p.businessId || "");
  const callerId = String(p.callerId || "");
  const conversationId = String(p.conversationId || "");
  const durationSeconds = Number(p.durationSeconds || 0);
  const transcript = String(p.transcript || "");
  const summary = String(p.summary || "");
  const classification = String(p.classification || "unknown");
  const recordingUrl = String(p.recordingUrl || "");
  const estimatedTokens = Number(p.estimatedTokens || 0);

  const { data: callLog } = await supabaseAdmin
    .from("call_logs")
    .insert({
      business_id: businessId,
      elevenlabs_conversation_id: conversationId,
      duration_seconds: durationSeconds,
      cost_pln: Math.round(estimatedTokens * 0.00065 * 100) / 100,
      internal_cost_pln: Math.round(estimatedTokens * 0.00065 * 100) / 100,
      caller_id: callerId || "unknown",
      from_number: String(metadata.from_number || callerId || ""),
      twilio_call_sid: String(metadata.twilio_call_sid || ""),
      routed_from_main: true,
      transcript,
      classification,
      ai_summary: summary,
      recording_url: recordingUrl,
      ended_at: new Date().toISOString(),
      tokens_input: Math.ceil(estimatedTokens * 0.4),
      tokens_output: Math.ceil(estimatedTokens * 0.6),
      tokens_total: estimatedTokens,
    })
    .select()
    .single();

  if (callLog) {
    await supabaseAdmin.from("conversations").insert({
      business_id: businessId,
      channel: "voice",
      status: "ended",
      caller_id: callerId || "unknown",
      caller_name: String(customData.caller_name || ""),
      summary,
      duration_seconds: durationSeconds || 0,
      message_count: transcript.split("\n").length || 1,
      started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    });
  }

      await supabaseAdmin.from("notifications").insert({
    business_id: businessId,
    type: "call",
    title: "Nowe połączenie",
    message: `Połączenie od ${callerId}${classification !== "unknown" ? ` (${classification})` : ""}${durationSeconds ? ` - ${Math.round(durationSeconds / 60)} min` : ""}`,
    metadata: { caller_id: callerId, classification, duration_seconds: durationSeconds, has_transcript: !!transcript, recording_url: recordingUrl },
  });

  if (customData.wa_consent && customData.wa_phone) {
    await sendWhatsApp(
      String(customData.wa_phone),
      "Dziękujemy za rozmowę z WitaLine! W razie pytań jesteśmy do dyspozycji.",
      undefined,
      callLog?.id,
      businessId
    );
  }

  if (callLog) {
    sendWebhook(businessId, {
      event: "call.completed",
      call_id: callLog.id,
      caller_id: callerId || "unknown",
      from_number: String(metadata.from_number || callerId || ""),
      duration_seconds: durationSeconds,
      classification,
      ai_summary: summary,
      transcript,
      recording_url: recordingUrl,
      was_helpful: null,
      started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    }).catch(() => {});
  }
}

async function handleJobClient(p: Record<string, unknown>): Promise<void> {
  const metadata = (p.metadata as Record<string, unknown>) || {};
  const customData = (p.customData as Record<string, unknown>) || {};
  const businessId = String(p.businessId || "");
  const callerId = String(p.callerId || "");
  const conversationId = String(p.conversationId || "");
  const durationSeconds = Number(p.durationSeconds || 0);
  const transcript = String(p.transcript || "");
  const summary = String(p.summary || "");
  const classification = String(p.classification || "unknown");
  const recordingUrl = String(p.recordingUrl || "");
  const estimatedTokens = Number(p.estimatedTokens || 0);
  const currentPlan = String(p.currentPlan || "start_100");
  const minutesUsed = Number(p.minutesUsed || 0);

  const costPln = calculateCost(durationSeconds, currentPlan);
  const internalCostPln = Math.round(estimatedTokens * 0.00065 * 100) / 100;

  const { data: callLog } = await supabaseAdmin
    .from("call_logs")
    .insert({
      business_id: businessId,
      elevenlabs_conversation_id: conversationId,
      duration_seconds: durationSeconds,
      cost_pln: costPln,
      internal_cost_pln: internalCostPln,
      revenue_pln: costPln,
      caller_id: callerId || "unknown",
      from_number: String(metadata.from_number || callerId || ""),
      twilio_call_sid: String(metadata.twilio_call_sid || ""),
      transcript,
      classification,
      ai_summary: summary,
      recording_url: recordingUrl,
      ended_at: new Date().toISOString(),
      tokens_input: Math.ceil(estimatedTokens * 0.4),
      tokens_output: Math.ceil(estimatedTokens * 0.6),
      tokens_total: estimatedTokens,
    })
    .select()
    .single();

  const minutesToAdd = Math.ceil(durationSeconds / 60);

  if (callLog) {
    await supabaseAdmin.from("conversations").insert({
      business_id: businessId,
      channel: "voice",
      status: "ended",
      caller_id: callerId || "unknown",
      caller_name: String(customData.caller_name || ""),
      summary,
      duration_seconds: durationSeconds || 0,
      message_count: transcript.split("\n").length || 1,
      started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    });
  }

  await supabaseAdmin
    .from("businesses")
    .update({
      minutes_used_this_week: minutesUsed + minutesToAdd,
      tokens_used_this_month: (Number(metadata.tokens_used_this_month) || 0) + estimatedTokens,
    })
    .eq("id", businessId);

  await supabaseAdmin.from("notifications").insert({
    business_id: businessId,
    type: "call",
    title: "Nowe połączenie",
    message: `Połączenie od ${callerId}${classification !== "unknown" ? ` (${classification})` : ""}${durationSeconds ? ` - ${Math.round(durationSeconds / 60)} min` : ""}`,
    metadata: { caller_id: callerId, classification, duration_seconds: durationSeconds, recording_url: recordingUrl },
  });

  if (customData.wa_consent && customData.wa_phone) {
    await sendWhatsApp(
      String(customData.wa_phone),
      "Dziękujemy za rozmowę!",
      undefined,
      callLog?.id,
      businessId
    );
  }

  if (callLog) {
    sendWebhook(businessId, {
      event: "call.completed",
      call_id: callLog.id,
      caller_id: callerId || "unknown",
      from_number: String(metadata.from_number || callerId || ""),
      duration_seconds: durationSeconds,
      classification,
      ai_summary: summary,
      transcript,
      recording_url: recordingUrl,
      was_helpful: null,
      started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    }).catch(() => {});
  }
}

async function handleJob(type: string, payload: Record<string, unknown>): Promise<void> {
  switch (type) {
    case "call_completed_main":
      return handleJobMain(payload);
    case "call_completed_client":
      return handleJobClient(payload);
    case "send_sms": {
      const { to, text, callLogId, businessId } = payload;
      await sendSms(String(to), String(text), String(callLogId || ""), String(businessId));
      break;
    }
    case "send_whatsapp": {
      const { to, text, callLogId, businessId } = payload;
      await sendWhatsApp(String(to), String(text), undefined, String(callLogId || ""), String(businessId));
      break;
    }
    case "send_webhook": {
      const { businessId, event, data } = payload;
      await (sendWebhook as any)(String(businessId), { event: String(event), ...(data as Record<string, unknown>) });
      break;
    }
    default:
      console.warn("[process-jobs] unknown job type:", type);
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || request.headers.get("x-internal-secret") || "";
  const expectedSecret = process.env.INTERNAL_WEBHOOK_SECRET || process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const processed = await processJobQueue(handleJob);

    return NextResponse.json({
      ok: true,
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[process-jobs] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "job-queue-processor",
    status: "ready",
    cron_secret_required: !!process.env.INTERNAL_WEBHOOK_SECRET || !!process.env.CRON_SECRET,
  });
}

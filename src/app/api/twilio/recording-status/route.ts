import { NextResponse } from "next/server";
import { validateRequest } from "twilio";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getPublicUrl(request: Request) {
  const url = new URL(request.url);
  const configuredBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configuredBase) {
    return `${configuredBase.replace(/\/$/, "")}${url.pathname}`;
  }
  return `${url.protocol}//${url.host}${url.pathname}`;
}

function formToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  formData.forEach((value, key) => {
    result[key] = typeof value === "string" ? value : "";
  });
  return result;
}

function validateTwilioSignature(request: Request, body: Record<string, string>): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return true;

  const signature = request.headers.get("x-twilio-signature") || "";
  return validateRequest(authToken, signature, getPublicUrl(request), body);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const fields = formToObject(formData);

  if (!validateTwilioSignature(request, fields)) {
    return NextResponse.json({ error: "Invalid Twilio signature" }, { status: 401 });
  }

  const callSid = fields.CallSid || "";
  const recordingSid = fields.RecordingSid || "";
  const recordingStatus = fields.RecordingStatus || "";
  const recordingUrl = fields.RecordingUrl || "";
  const recordingDuration = Number.parseFloat(fields.RecordingDuration || "0") || 0;
  const targetNumber = new URL(request.url).searchParams.get("target_number") || "";
  const reason = new URL(request.url).searchParams.get("reason") || "";

  if (!callSid || !recordingSid || !recordingStatus) {
    return NextResponse.json({ error: "Missing Twilio recording callback fields" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("call_logs")
    .select("id, business_id")
    .is("deleted_at", null)
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  if (!existing?.id) {
    console.warn("[recording-status] call_log not found for Twilio CallSid:", callSid);
    return NextResponse.json({ ok: true, skipped: "call_log_not_found" });
  }

  const updates: Record<string, unknown> = {
    has_human_handoff: true,
    handoff_status: recordingStatus,
    handoff_reason: reason,
    handoff_target_number: targetNumber,
    handoff_recording_sid: recordingSid,
    handoff_recording_url: recordingUrl,
    handoff_ended_at: new Date().toISOString(),
    handoff_duration_seconds: Math.round(recordingDuration),
  };

  if (recordingStatus === "completed") {
    updates.post_handoff_transcription_status = "pending";
    updates.post_handoff_error = "";
  } else if (recordingStatus === "failed") {
    updates.post_handoff_transcription_status = "failed";
    updates.post_handoff_error = "Twilio recording failed";
  }

  const { error } = await supabaseAdmin
    .from("call_logs")
    .update(updates)
    .eq("id", existing.id);

  if (error) {
    console.error("[recording-status] failed to update call_log:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (recordingStatus === "completed" && recordingUrl) {
    const secret = process.env.HANDOFF_TRANSCRIPTION_SECRET || process.env.INTERNAL_WEBHOOK_SECRET || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (secret) headers["x-witaline-internal-secret"] = secret;

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || `${new URL(request.url).protocol}//${new URL(request.url).host}`).replace(/\/$/, "");
    void fetch(`${baseUrl}/api/elevenlabs/transcribe-handoff-recording`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        callLogId: existing.id,
        recordingSid,
        recordingUrl,
        targetNumber,
        reason,
      }),
    }).catch((err) => {
      console.error("[recording-status] failed to enqueue handoff transcription:", err);
    });
  }

  return NextResponse.json({ ok: true, callLogId: existing.id });
}

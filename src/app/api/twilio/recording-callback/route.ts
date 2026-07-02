import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const originalCallSid = url.searchParams.get("callSid") || "";
    const businessId = url.searchParams.get("businessId") || "";

    const formData = await request.formData();
    const recordingSid = String(formData.get("RecordingSid") || "");
    const recordingUrl = String(formData.get("RecordingUrl") || "");
    const recordingStatus = String(formData.get("RecordingStatus") || "");
    const duration = String(formData.get("RecordingDuration") || "0");

    console.log("[recording-callback] status:", recordingStatus, "recordingSid:", recordingSid, "originalCallSid:", originalCallSid, "duration:", duration);

    if (recordingStatus !== "completed" || !recordingSid) {
      return NextResponse.json({ ok: true });
    }

    const fullRecordingUrl = recordingUrl || `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Recordings/${recordingSid}`;

    let callLogId: string | null = null;

    if (originalCallSid) {
      const { data: log } = await supabaseAdmin
        .from("call_logs")
        .select("id")
        .is("deleted_at", null)
        .eq("twilio_call_sid", originalCallSid)
        .maybeSingle();
      if (log) callLogId = log.id;
    }

    if (!callLogId && businessId) {
      const { data: log } = await supabaseAdmin
        .from("call_logs")
        .select("id")
        .is("deleted_at", null)
        .eq("business_id", businessId)
        .is("handoff_recording_sid", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (log) callLogId = log.id;
    }

    if (!callLogId) {
      console.warn("[recording-callback] no call_log found for originalCallSid:", originalCallSid, "businessId:", businessId);
      return NextResponse.json({ ok: true });
    }

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("call_logs")
      .update({
        handoff_recording_sid: recordingSid,
        handoff_recording_url: fullRecordingUrl,
        handoff_ended_at: now,
        handoff_duration_seconds: parseInt(duration, 10) || 0,
        has_human_handoff: true,
      })
      .eq("id", callLogId);

    // Trigger transcription asynchronously
    const secret = process.env.HANDOFF_TRANSCRIPTION_SECRET || process.env.INTERNAL_WEBHOOK_SECRET || "";
    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    fetch(`${baseUrl}/api/elevenlabs/transcribe-handoff-recording`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-witaline-internal-secret": secret } : {}),
      },
      body: JSON.stringify({
        callLogId,
        recordingSid,
        recordingUrl: fullRecordingUrl,
      }),
    }).catch((err) => console.error("[recording-callback] transcription trigger failed:", err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[recording-callback] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: true });
  }
}

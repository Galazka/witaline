import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const auth = await checkAdminAuth();
  if (auth.error) return auth.error;

  const { phoneNumber } = await request.json();
  if (!phoneNumber) {
    return NextResponse.json({ error: "phoneNumber required" }, { status: 400 });
  }

  // Clean phone number format
  const cleanPhone = phoneNumber.replace(/[^+\d]/g, "");
  const results: Record<string, number> = {};

  // 1. Anonymize call_logs — set caller_id to "[deleted]" and clear transcript/recording
  const { data: callLogs, error: callErr } = await supabaseAdmin
    .from("call_logs")
    .update({
      caller_id: "[usunięto na żądanie]",
      from_number: "[deleted]",
      transcript: "",
      ai_summary: "",
      recording_url: "",
      post_handoff_transcript: "",
      post_handoff_summary: "",
      handoff_recording_sid: "",
      handoff_recording_url: "",
    })
    .or(`caller_id.eq.${cleanPhone},from_number.eq.${cleanPhone}`)
    .select();

  if (!callErr) results.call_logs = callLogs?.length || 0;

  // 2. Anonymize feedback
  const { data: fb, error: fbErr } = await supabaseAdmin
    .from("feedback")
    .update({ caller_phone: "[deleted]", comment: "" })
    .eq("caller_phone", cleanPhone)
    .select();
  if (!fbErr) results.feedback = fb?.length || 0;

  // 3. Delete conversations with matching caller_id
  const { data: convs, error: convErr } = await supabaseAdmin
    .from("conversations")
    .update({
      caller_id: "[deleted]",
      caller_name: "[deleted]",
      summary: "",
    })
    .eq("caller_id", cleanPhone)
    .select();
  if (!convErr) results.conversations = convs?.length || 0;

  // 4. Anonymize callback_requests
  const { data: cb, error: cbErr } = await supabaseAdmin
    .from("callback_requests")
    .update({ caller_number: "[deleted]", caller_name: "[deleted]", matter: "" })
    .eq("caller_number", cleanPhone)
    .select();
  if (!cbErr) results.callback_requests = cb?.length || 0;

  // 5. Delete transcriptions for anonymized call_logs
  const { data: deletedCallIds } = await supabaseAdmin
    .from("call_logs")
    .select("id")
    .or(`caller_id.eq.[deleted],from_number.eq.[deleted]`);

  if (deletedCallIds && deletedCallIds.length > 0) {
    const ids = deletedCallIds.map(r => r.id);
    const { error: tErr } = await supabaseAdmin
      .from("transcriptions")
      .delete()
      .in("call_log_id", ids);
    if (!tErr) results.transcriptions = ids.length;
  }

  // 6. Log the GDPR request
  await supabaseAdmin.from("contact_messages").insert({
    company: "GDPR DSR Request",
    contact: cleanPhone,
    message: `Automatic GDPR deletion request processed. Deleted/anonymized records: ${JSON.stringify(results)}`,
  });

  return NextResponse.json({
    ok: true,
    message: `Przetworzono żądanie usunięcia danych dla numeru ${cleanPhone}`,
    details: results,
  });
}

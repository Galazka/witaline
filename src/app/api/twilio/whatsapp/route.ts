import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsApp, WHATSAPP_CONTINUITY_TEMPLATES } from "@/lib/twilio-whatsapp";
import { addNotification } from "@/lib/notifications";

const WITALINE_MAIN_BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: Request) {
  const formData = await request.formData();
  const from = (formData.get("From") as string) || "";
  const body = (formData.get("Body") as string) || "";
  const messageSid = (formData.get("MessageSid") as string) || "";
  const profileName = (formData.get("ProfileName") as string) || "";
  const numMedia = parseInt(formData.get("NumMedia") as string || "0", 10);

  const waFrom = from.replace(/^whatsapp:/, "");
  const callerPhone = waFrom.replace(/^\+/, "");

  console.log("[whatsapp] incoming from:", waFrom, "body:", body.slice(0, 100));

  // Check if this number has a recent call_log or lead
  const { data: recentCall } = await supabaseAdmin
    .from("call_logs")
    .select("business_id, id")
    .eq("from_number", waFrom)
    .or(`caller_id.eq.${callerPhone}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const businessId = recentCall?.business_id || WITALINE_MAIN_BUSINESS_ID;
  const isMainLine = businessId === WITALINE_MAIN_BUSINESS_ID;

  // Store incoming message
  await supabaseAdmin.from("wa_logs").insert({
    business_id: businessId,
    to_number: waFrom,
    message_body: body,
    status: "received",
    twilio_sid: messageSid,
    direction: "inbound",
    profile_name: profileName || null,
    has_media: numMedia > 0,
  });

  // Notify business owner
  await addNotification({
    businessId,
    type: "system",
    title: "Nowa wiadomość WhatsApp",
    message: `Od: ${profileName || waFrom}${body ? `: "${body.slice(0, 80)}..."` : ""}`,
    metadata: { from: waFrom, body, profile_name: profileName, message_sid: messageSid, has_media: numMedia > 0 },
  });

  // Auto-reply with simple acknowledgment
  const autoReply = `Cześć ${profileName || "!"} ✋\n\nDziękujemy za wiadomość. Jeśli potrzebujesz pomocy, oddzwonimy lub odpiszemy najszybciej jak to możliwe.\n\n— Zespół WitaLine`;

  const sent = await sendWhatsApp(waFrom, autoReply, undefined, recentCall?.id, businessId);

  console.log("[whatsapp] auto-reply sent:", sent.success);

  return NextResponse.json({ ok: true });
}

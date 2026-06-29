import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPendingTransfer, deletePendingTransfer, findPendingTransferByBusinessId } from "@/lib/transfer-store";
import { escapeXml, dialConsultantToQueue } from "@/lib/twilio-utils";

function twiml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

function getBaseUrl(request: Request): string {
  const host = request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://witaline-production.up.railway.app";
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const callSid = url.searchParams.get("callSid") || "";
  const businessId = url.searchParams.get("businessId") || "00000000-0000-0000-0000-000000000001";
  const fromNumber = url.searchParams.get("fromNumber") || "";
  const toNumber = url.searchParams.get("toNumber") || "";

  console.log("[transfer-router] Stream ended, callSid:", callSid, "businessId:", businessId);

  // Szukaj pending transfer: najpierw po businessId (call_sid kolumna), potem po callSid, potem po business_id w tabeli
  let pending = await getPendingTransfer(businessId);
  if (!pending) pending = await getPendingTransfer(callSid);
  if (!pending) {
    const byBiz = await findPendingTransferByBusinessId(businessId);
    if (byBiz) pending = byBiz.data;
  }
  if (!pending) {
    const byMainBiz = await findPendingTransferByBusinessId("00000000-0000-0000-0000-000000000001");
    if (byMainBiz) pending = byMainBiz.data;
  }

  console.log("[transfer-router] pending found:", !!pending);

  if (pending) {
    await deletePendingTransfer(businessId).catch(e => console.error("[transfer-router] deletePendingTransfer error:", e));

    const { data: consultants } = await supabaseAdmin
      .from("business_consultants")
      .select("phone")
      .eq("business_id", pending.businessId)
      .order("sort_order", { ascending: true });

    const callerId = pending.callerId || process.env.TWILIO_PHONE_NUMBER || "";
    const baseUrl = getBaseUrl(request).replace(/\/+$/, "");

    // Czy firma ma prawdziwych konsultantów? Użyj ich numeru jeśli tak, w przeciwnym razie użyj target z pending (WitaLine centrala)
    const hasRealConsultants = consultants && consultants.length > 0;
    const targetPhone = hasRealConsultants ? consultants[0].phone : pending.targetNumber;

    // Real consultant exists - use queue flow
    const queueName = `handoff_${callSid || "fallback"}`;
    const holdMusicUrl = `${baseUrl}/api/twilio/hold-music`;
    const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${encodeURIComponent(pending.businessId)}&callSid=${encodeURIComponent(callSid)}`;

    const responseTwiml = twiml(`
<Enqueue waitUrl="${escapeXml(holdMusicUrl)}" action="${escapeXml(actionUrl)}" method="POST" waitUrlMethod="POST">
  <Queue>${escapeXml(queueName)}</Queue>
</Enqueue>
<Redirect method="POST">${escapeXml(`${baseUrl}/api/twilio/transfer-fallback?businessId=${encodeURIComponent(pending.businessId)}`)}</Redirect>
`);

    dialConsultantToQueue(targetPhone, callerId, queueName, baseUrl, pending.businessId, callSid)
      .catch(err => console.error("[transfer-router] dial consultant failed:", err));

    return responseTwiml;
  }

  console.log("[transfer-router] no pending transfer, hanging up");
  return twiml("<Hangup/>");
}
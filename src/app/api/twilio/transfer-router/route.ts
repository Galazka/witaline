import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPendingTransfer, deletePendingTransfer } from "@/lib/transfer-store";
import { escapeXml, dialConsultantToQueue, registerCall } from "@/lib/twilio-utils";

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

  let pending = await getPendingTransfer(businessId) || await getPendingTransfer(callSid);

  if (pending) {
    console.log("[transfer-router] pending transfer found →", pending.targetNumber);
    await deletePendingTransfer(businessId);
    await deletePendingTransfer(callSid);

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
    const holdMusicUrl = process.env.HOLD_MUSIC_URL || "https://cdn.witaline.app/hold-music.mp3";
    const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${encodeURIComponent(pending.businessId)}&callSid=${encodeURIComponent(callSid)}`;

    const responseTwiml = twiml(`
<Enqueue waitUrl="${escapeXml(holdMusicUrl)}" action="${escapeXml(actionUrl)}" method="POST">
  ${escapeXml(queueName)}
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
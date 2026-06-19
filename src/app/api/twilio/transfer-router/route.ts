import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPendingTransfer, deletePendingTransfer } from "@/lib/transfer-store";
import { escapeXml } from "@/lib/twilio-utils";

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

  console.log("[transfer-router] Stream ended, callSid:", callSid, "businessId:", businessId);

  // Szukaj po businessId (MCP handler zapisuje pod bizId), potem po callSid
  let pending = getPendingTransfer(businessId) || getPendingTransfer(callSid);

  if (pending) {
    console.log("[transfer-router] pending transfer found →", pending.targetNumber);
    deletePendingTransfer(businessId);
    deletePendingTransfer(callSid);

    const { data: consultants } = await supabaseAdmin
      .from("business_consultants")
      .select("phone")
      .eq("business_id", pending.businessId)
      .order("sort_order", { ascending: true });

    const callerId = pending.callerId || process.env.TWILIO_PHONE_NUMBER || "";
    const safeCallerId = escapeXml(callerId);
    const baseUrl = getBaseUrl(request).replace(/\/+$/, "");

    const consultantPhone = (consultants && consultants.length > 0) ? consultants[0].phone : pending.targetNumber;
    const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${encodeURIComponent(pending.businessId)}&idx=${consultants?.length ? 1 : 0}`;
    const fallbackUrl = `${baseUrl}/api/twilio/transfer-fallback?businessId=${encodeURIComponent(pending.businessId)}`;
    const recordingCallbackUrl = `${baseUrl}/api/twilio/recording-callback?callSid=${encodeURIComponent(callSid)}&businessId=${encodeURIComponent(businessId)}`;

    // Hold music + komunikat — Maja mogła nie zdążyć powiedzieć "przekazuję"
    const holdMusicUrl = process.env.HOLD_MUSIC_URL || "";
    const holdMusicTag = holdMusicUrl ? `<Play>${escapeXml(holdMusicUrl)}</Play>` : "";
    return twiml(`
      ${holdMusicTag}
      <Say language="pl-PL">Proszę czekać, łączę z konsultantem.</Say>
      <Dial callerId="${safeCallerId}" timeout="25" record="record-from-answer-dual" recordingStatusCallback="${escapeXml(recordingCallbackUrl)}" recordingStatusCallbackEvent="completed" action="${escapeXml(actionUrl)}" method="POST">
        <Number>${escapeXml(consultantPhone)}</Number>
      </Dial>
      <Redirect method="POST">${escapeXml(fallbackUrl)}</Redirect>
    `);
  }

  console.log("[transfer-router] no pending transfer, hanging up");
  return twiml("<Hangup/>");
}
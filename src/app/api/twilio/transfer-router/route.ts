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
  const fromNumber = url.searchParams.get("fromNumber") || "";
  const toNumber = url.searchParams.get("toNumber") || "";

  console.log("[transfer-router] Stream ended, callSid:", callSid, "businessId:", businessId);

  const pending = getPendingTransfer(callSid);

  if (pending) {
    console.log("[transfer-router] pending transfer found →", pending.targetNumber);
    deletePendingTransfer(callSid);

    const { data: consultants } = await supabaseAdmin
      .from("business_consultants")
      .select("phone")
      .eq("business_id", pending.businessId)
      .order("sort_order", { ascending: true });

    const callerId = pending.callerId || toNumber;
    const safeCallerId = escapeXml(callerId);
    const baseUrl = getBaseUrl(request).replace(/\/+$/, "");
    const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${pending.businessId}&idx=1`;

    if (consultants && consultants.length > 0) {
      return twiml(`
        <Say language="pl-PL">Prosz\u0119 czeka\u0107, \u0142\u0105cz\u0119 z konsultantem.</Say>
        <Dial callerId="${safeCallerId}" timeout="25" action="${escapeXml(actionUrl)}" method="POST">
          <Number>${escapeXml(consultants[0].phone)}</Number>
        </Dial>
        <Say language="pl-PL">Przepraszamy, \u017caden z konsultant\u00f3w nie odebra\u0142. Prosz\u0119 zostawi\u0107 wiadomo\u015b\u0107 lub spr\u00f3bowa\u0107 p\u00f3\u017aniej.</Say>
        <Hangup/>
      `);
    }

    return twiml(`
      <Say language="pl-PL">Prosz\u0119 czeka\u0107, \u0142\u0105cz\u0119 z konsultantem.</Say>
      <Dial callerId="${safeCallerId}" timeout="25" action="${escapeXml(actionUrl)}" method="POST">
        <Number>${escapeXml(pending.targetNumber)}</Number>
      </Dial>
      <Say language="pl-PL">Przepraszamy, konsultant nie odebra\u0142. Oddzwonimy.</Say>
      <Hangup/>
    `);
  }

  console.log("[transfer-router] no pending transfer, hanging up");
  return twiml("<Hangup/>");
}
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPendingTransfer, deletePendingTransfer } from "@/lib/transfer-store";
import { escapeXml, humanHandoffNextTwiML } from "@/lib/twilio-utils";

function twiml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const callSid = url.searchParams.get("callSid") || "";
  const businessId = url.searchParams.get("businessId") || "00000000-0000-0000-0000-000000000001";
  const fromNumber = url.searchParams.get("fromNumber") || "";
  const toNumber = url.searchParams.get("toNumber") || "";

  console.log("[transfer-router] Stream ended, callSid:", callSid, "businessId:", businessId);

  // Check if there's a pending transfer for this call
  const pending = getPendingTransfer(callSid);

  if (pending) {
    console.log("[transfer-router] pending transfer found →", pending.targetNumber);
    deletePendingTransfer(callSid);

    // Get consultants for this business
    const { data: consultants } = await supabaseAdmin
      .from("business_consultants")
      .select("phone")
      .eq("business_id", pending.businessId)
      .order("sort_order", { ascending: true });

    const callerId = pending.callerId || toNumber;
    const safeCallerId = escapeXml(callerId);

    if (consultants && consultants.length > 0) {
      // Dial first consultant, with action for no-answer hunting
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
      const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${pending.businessId}&idx=1`;
      return twiml(`
        <Say language="pl-PL">Proszę czekać, łączę z konsultantem.</Say>
        <Dial callerId="${safeCallerId}" timeout="25" action="${escapeXml(actionUrl)}" method="POST">
          <Number>${escapeXml(consultants[0].phone)}</Number>
        </Dial>
        <Say language="pl-PL">Przepraszamy, żaden z konsultantów nie odebrał. Proszę zostawić wiadomość lub spróbować później.</Say>
        <Hangup/>
      `);
    }

    // No consultants — fallback to pending.targetNumber
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${pending.businessId}&idx=1`;
    return twiml(`
      <Say language="pl-PL">Proszę czekać, łączę z konsultantem.</Say>
      <Dial callerId="${safeCallerId}" timeout="25" action="${escapeXml(actionUrl)}" method="POST">
        <Number>${escapeXml(pending.targetNumber)}</Number>
      </Dial>
      <Say language="pl-PL">Przepraszamy, konsultant nie odebrał. Oddzwonimy.</Say>
      <Hangup/>
    `);
  }

  // No pending transfer — call ended normally
  console.log("[transfer-router] no pending transfer, hanging up");
  return twiml("<Hangup/>");
}
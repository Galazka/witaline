import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { twimlDocument, escapeXml } from "@/lib/twilio-utils";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_SEC = 10;

function twilioApiRedirect(callSid: string, fallbackUrl: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !callSid) return Promise.resolve(false);
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const twiml = `<Response><Redirect method="POST">${escapeXml(fallbackUrl)}</Redirect></Response>`;
  const body = new URLSearchParams({ Twiml: twimlDocument(twiml) });
  return fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${callSid}.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  }).then(r => r.ok).catch(() => false);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const consulCallSid = (formData.get("CallSid") as string) || "";
    const callStatus = (formData.get("CallStatus") as string) || "";
    const queue = request.nextUrl.searchParams.get("queue") || "";
    const originalCallSid = request.nextUrl.searchParams.get("callSid") || "";
    const businessId = request.nextUrl.searchParams.get("businessId") || "";

    console.log("[transfer-status] callback:", { consulCallSid, callStatus, queue, originalCallSid });

    if (!queue) {
      console.log("[transfer-status] no queue in query, skipping");
      return NextResponse.json({ ok: true });
    }

    if (callStatus === "in-progress" || callStatus === "completed") {
      console.log("[transfer-status] consultant answered, queue:", queue);
      return NextResponse.json({ ok: true });
    }

    if (callStatus === "busy" || callStatus === "no-answer" || callStatus === "failed") {
      if (originalCallSid && businessId) {
        const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const fallbackUrl = `${baseUrl.replace(/\/+$/, "")}/api/twilio/transfer-fallback?businessId=${encodeURIComponent(businessId)}`;
        const redirected = await twilioApiRedirect(originalCallSid, fallbackUrl);
        console.log("[transfer-status] max attempts, redirected caller to fallback:", redirected, "callSid:", originalCallSid);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[transfer-status] error:", e);
    return NextResponse.json({ ok: true });
  }
}

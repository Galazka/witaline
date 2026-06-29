import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { escapeXml } from "@/lib/twilio-utils";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

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
  try {
    const formData = await request.formData();
    const dialCallStatus = String(formData.get("DialCallStatus") || "");
    const queueResult = String(formData.get("QueueResult") || "");
    const from = String(formData.get("From") || "");
    const to = String(formData.get("To") || "");

    console.log("[human-handoff/next] dialCallStatus:", dialCallStatus, "queueResult:", queueResult, "from:", from, "to:", to);

    const url = new URL(request.url);
    const businessId = url.searchParams.get("businessId") || WITALINE_MAIN_BUSINESS_ID;
    const baseUrl = getBaseUrl(request).replace(/\/+$/, "");
    const fallbackUrl = `${baseUrl}/api/twilio/transfer-fallback?businessId=${encodeURIComponent(businessId)}`;

    // Called from <Enqueue> action — bridge with consultant succeeded
    if (queueResult === "bridged") {
      console.log("[human-handoff/next] BRIDGE SUCCESS - returning empty response");
      return twiml("");
    }
    if (queueResult) {
      console.log("[human-handoff/next] QueueResult exists but not bridged:", queueResult);
      return twiml("<Hangup/>");
    }

    // Called from <Dial> action (backward compat with old flow)
    if (dialCallStatus === "completed") {
      return twiml(`<Redirect method="POST">${escapeXml(fallbackUrl)}</Redirect>`);
    }

    if (dialCallStatus && dialCallStatus !== "completed") {
      const idx = parseInt(url.searchParams.get("idx") || "0", 10);
      const { data: consultants } = await supabaseAdmin
        .from("business_consultants")
        .select("phone")
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true });

      if (consultants && idx < consultants.length) {
        const nextConsultant = consultants[idx];
        const callerId = to;
        const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${encodeURIComponent(businessId)}&idx=${idx + 1}`;
        const recordingCallbackUrl = `${baseUrl}/api/twilio/recording-callback?callSid=&businessId=${encodeURIComponent(businessId)}`;

        return twiml(`
          <Dial callerId="${escapeXml(callerId)}" timeout="20" record="record-from-answer-dual" recordingStatusCallback="${escapeXml(recordingCallbackUrl)}" recordingStatusCallbackEvent="completed" action="${escapeXml(actionUrl)}" method="POST">
            <Number>${escapeXml(nextConsultant.phone)}</Number>
          </Dial>
        `);
      }
    }

    return twiml(`<Redirect method="POST">${escapeXml(fallbackUrl)}</Redirect>`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[human-handoff/next] error:", msg);
    return twiml(`<Say language="pl-PL">Przepraszamy, wystąpił błąd. Dziękujemy za rozmowę.</Say><Hangup/>`);
  }
}
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
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
  const formData = await request.formData();
  const dialCallStatus = String(formData.get("DialCallStatus") || "");
  const from = String(formData.get("From") || "");
  const to = String(formData.get("To") || "");

  console.log("[human-handoff/next] status:", dialCallStatus || "unknown", "from:", from, "to:", to);

  // Jeśli ktoś odebrał — koniec
  if (dialCallStatus === "completed") {
    return twiml("<Hangup/>");
  }

  const url = new URL(request.url);
  const businessId = url.searchParams.get("businessId") || "00000000-0000-0000-0000-000000000001";
  const idx = parseInt(url.searchParams.get("idx") || "0", 10);

  const { data: consultants } = await supabaseAdmin
    .from("business_consultants")
    .select("phone")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (consultants && idx < consultants.length) {
    // Spróbuj kolejnego konsultanta
    const nextConsultant = consultants[idx];
    const callerId = to;
    const baseUrl = getBaseUrl(request).replace(/\/+$/, "");
    const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${encodeURIComponent(businessId)}&idx=${idx + 1}`;

    return twiml(`
      <Dial callerId="${escapeXml(callerId)}" timeout="20" action="${escapeXml(actionUrl)}" method="POST">
        <Number>${escapeXml(nextConsultant.phone)}</Number>
      </Dial>
    `);
  }

  // Żaden konsultant nie odebrał — Maja wraca do rozmowy (nowy Stream)
  const baseUrl = getBaseUrl(request).replace(/\/+$/, "");
  const fallbackUrl = `${baseUrl}/api/twilio/transfer-fallback?businessId=${encodeURIComponent(businessId)}`;
  return twiml(`<Redirect method="POST">${escapeXml(fallbackUrl)}</Redirect>`);
}
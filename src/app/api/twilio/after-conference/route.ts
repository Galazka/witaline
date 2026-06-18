import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function twiml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const businessId = url.searchParams.get("businessId") || "00000000-0000-0000-0000-000000000001";
  const idx = parseInt(url.searchParams.get("idx") || "0", 10);

  const { data: consultants } = await supabaseAdmin
    .from("business_consultants")
    .select("phone")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (consultants && idx < consultants.length) {
    // Jest kolejny konsultant — spróbuj dzwonić dalej poprzez Redirect
    const baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://witaline-production.up.railway.app").replace(/\/+$/, "");
    const redirectUrl = `${baseUrl}/api/twilio/transfer-router?retry=1&businessId=${encodeURIComponent(businessId)}&consultantPhone=${encodeURIComponent(consultants[idx].phone)}&idx=${idx + 1}`;
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Redirect>${escapeXml(redirectUrl)}</Redirect></Response>`, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }

  // Żaden konsultant nie odebrał — zapytaj czy zostawić wiadomość
  return twiml(`
    <Gather numDigits="1" timeout="5" action="/api/twilio/human-handoff/voicemail?businessId=${encodeURIComponent(businessId)}" method="POST">
      <Say language="pl-PL">Przepraszamy, \u017caden z konsultant\u00f3w nie odebra\u0142. Je\u015bli chcesz zostawi\u0107 wiadomo\u015b\u0107 dla konsultanta, naci\u015bnij 1. Aby zako\u0144czy\u0107 rozmow\u0119, naci\u015bnij 2.</Say>
    </Gather>
    <Say language="pl-PL">Nie otrzymali\u015bmy odpowiedzi. Dzi\u0119kujemy za rozmow\u0119, oddzwonimy.</Say>
    <Hangup/>
  `);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
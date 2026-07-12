import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

function twiml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const digits = String(formData.get("Digits") || "");
  const from = String(formData.get("From") || "").replace(/^\+/, "");
  const url = new URL(request.url);
  const businessId = url.searchParams.get("businessId") || WITALINE_MAIN_BUSINESS_ID;

  if (digits === "1") {
    // Klient chce zostawić wiadomość
    return twiml(`
      <Say language="pl-PL">Po sygnale prosz\u0119 nagra\u0107 swoj\u0105 wiadomo\u015b\u0107. Po zako\u0144czeniu naci\u015bnij krzy\u017cyk.</Say>
      <Record maxLength="120" action="/api/twilio/voicemail-done?businessId=${encodeURIComponent(businessId)}&amp;from=${encodeURIComponent(from)}" method="POST" />
      <Say language="pl-PL">Nie nagrano wiadomo\u015bci. Dzi\u0119kujemy za rozmow\u0119.</Say>
      <Hangup/>
    `);
  }

  // Klient nacisnął 2 lub inny klawisz — zakończ
  return twiml(`
    <Say language="pl-PL">Dzi\u0119kujemy za rozmow\u0119. Do us\u0142yszenia.</Say>
    <Hangup/>
  `);
}
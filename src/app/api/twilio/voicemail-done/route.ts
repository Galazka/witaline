import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function twiml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const recordingUrl = String(formData.get("RecordingUrl") || "");
  const from = String(formData.get("From") || "").replace(/^\+/, "");
  const url = new URL(request.url);
  const businessId = url.searchParams.get("businessId") || "00000000-0000-0000-0000-000000000001";
  const callerPhone = url.searchParams.get("from") || from;

  if (recordingUrl) {
    await supabaseAdmin.from("notifications").insert({
      business_id: businessId,
      type: "voicemail",
      title: "Nowa wiadomo\u015b\u0107 od klienta",
      message: `Klient ${callerPhone || "nieznany"} zostawi\u0142 wiadomo\u015b\u0107: ${recordingUrl}.mp3`,
    }).maybeSingle();
  }

  return twiml(`
    <Say language="pl-PL">Dzi\u0119kujemy za wiadomo\u015b\u0107. Konsultant oddzwoni wkr\u00f3tce. Do us\u0142yszenia.</Say>
    <Hangup/>
  `);
}
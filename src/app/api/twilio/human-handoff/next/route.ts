import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { humanHandoffNextTwiML } from "@/lib/twilio-utils";

function twiml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
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

  // Pobierz listę konsultantów
  const { data: consultants } = await supabaseAdmin
    .from("business_consultants")
    .select("phone")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (!consultants || idx >= consultants.length) {
    // Koniec listy — nikt nie odebrał
    return twiml(`<Say language="pl-PL">Przepraszamy, żaden z konsultantów nie odebrał. Oddzwonimy z podsumowaniem rozmowy.</Say><Hangup/>`);
  }

  const nextConsultant = consultants[idx];
  const callerId = to;

  // Dzwoni do kolejnego z indeksem idx+1
  return twiml(humanHandoffNextTwiML(nextConsultant.phone, callerId, businessId, idx + 1));
}
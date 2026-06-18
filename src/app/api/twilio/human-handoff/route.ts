import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { humanHandoffTwiML, humanHandoffHuntTwiML } from "@/lib/twilio-utils";

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
  const digits = String(formData.get("Digits") || "");
  const from = String(formData.get("From") || "");
  const to = String(formData.get("To") || "");
  const baseUrl = getBaseUrl(request).replace(/\/+$/, "");

  if (digits && digits !== "0") {
    return humanHandoffTwiML(process.env.WITALINE_CONSULTANT_NUMBER || "", to, "WitaLine", "dtmf");
  }

  const toClean = to.replace(/^\+/, "").replace(/\D/g, "");
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, name, phone, twilio_number")
    .eq("twilio_number", toClean)
    .maybeSingle();

  const businessId = business?.id || "00000000-0000-0000-0000-000000000001";
  const businessName = business?.name || "WitaLine";
  const callerId = business?.twilio_number || to;

  const { data: consultants } = await supabaseAdmin
    .from("business_consultants")
    .select("phone")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (consultants && consultants.length > 0) {
    const first = consultants[0].phone;
    return twiml(humanHandoffHuntTwiML(first, callerId, businessName, businessId, 1, consultants.length, baseUrl));
  }

  const targetNumber = business?.phone || process.env.WITALINE_CONSULTANT_NUMBER;
  if (!targetNumber) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pl-PL">Nie skonfigurowano numeru konsultanta. Oddzwonimy z podsumowaniem rozmowy.</Say><Hangup/></Response>`, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }

  return humanHandoffTwiML(targetNumber, callerId, businessName, "dtmf");
}
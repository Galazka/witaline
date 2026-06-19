import { NextResponse } from "next/server";
import { registerTransferFallback } from "@/lib/twilio-utils";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { escapeXml } from "@/lib/twilio-utils";

function twiml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const from = String(formData.get("From") || "");
    const to = String(formData.get("To") || "");

    const url = new URL(request.url);
    const businessId = url.searchParams.get("businessId") || "00000000-0000-0000-0000-000000000001";

    console.log("[transfer-fallback] consultant didn't answer, restarting Maja for", from);

    // Zapisz notyfikację o nieudanym transferze
    await supabaseAdmin.from("notifications").insert({
      business_id: businessId,
      type: "call",
      title: "Konsultant nie odebra\u0142",
      message: `Klient ${from || "nieznany"} czeka\u0142 na konsultanta, ale nikt nie odebra\u0142. Maja wr\u00f3ci do rozmowy.`,
    }).maybeSingle();

    // Rozpocznij nową sesję ElevenLabs z informacją o nieudanym transferze
    const xml = await registerTransferFallback(from, to, businessId);

    return new NextResponse(xml, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[transfer-fallback] failed:", msg);

    // Maja nie wrocila — zaproponuj voicemail jako fallback
    const voicemailUrl = `/api/twilio/voicemail?businessId=${encodeURIComponent(new URL(request.url).searchParams.get("businessId") || "00000000-0000-0000-0000-000000000001")}`;
    return twiml(`
      <Say language="pl-PL">Przepraszamy, konsultant jest obecnie niedostępny.</Say>
      <Gather numDigits="1" action="${escapeXml(voicemailUrl)}" method="POST">
        <Say language="pl-PL">Naciśnij 1, aby zostawić wiadomość. Naciśnij 2, aby zakończyć.</Say>
      </Gather>
      <Say language="pl-PL">Nie rozpoznano wyboru. Dziękujemy za rozmowę.</Say>
      <Hangup/>
    `);
  }
}
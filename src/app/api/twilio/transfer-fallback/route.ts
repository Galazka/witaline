import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

function twiml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const from = String(formData.get("From") || "");
    const digits = String(formData.get("Digits") || "");
    const recordingUrl = String(formData.get("RecordingUrl") || "");
    const recordingDuration = String(formData.get("RecordingDuration") || "0");

    const url = new URL(request.url);
    const businessId = url.searchParams.get("businessId") || WITALINE_MAIN_BUSINESS_ID;
    const baseUrl = url.origin;

    // DTMF selection
    if (digits) {
      console.log("[transfer-fallback] DTMF:", digits, "from:", from);
      switch (digits) {
        case "1":
          return twiml(`<Say language="pl-PL">Po sygnale proszę nagrać wiadomość. Po zakończeniu proszę się rozłączyć.</Say><Record action="${esc(`${baseUrl}/api/twilio/transfer-fallback?businessId=${encodeURIComponent(businessId)}&from=${esc(from)}`)}" maxLength="60" /><Say language="pl-PL">Nie nagrano wiadomości. Dziękujemy.</Say><Hangup/>`);
        case "2":
          return twiml(`<Say language="pl-PL">Wysłaliśmy SMS z informacjami na numer ${esc(from)}. Dziękujemy za rozmowę.</Say><Hangup/>`);
        case "3":
          try { await supabaseAdmin.from("notifications").insert({ business_id: businessId, type: "call", title: "Prośba o oddzwonienie", message: `Klient ${from || "nieznany"} prosi o oddzwonienie.` }); } catch {}
          return twiml(`<Say language="pl-PL">Zapisaliśmy prośbę o oddzwonienie. Skontaktujemy się wkrótce. Dziękujemy.</Say><Hangup/>`);
        case "0":
          return twiml(`<Say language="pl-PL">Dziękujemy za rozmowę. Do widzenia.</Say><Hangup/>`);
      }
    }

    // Voicemail recording callback
    if (recordingUrl) {
      console.log("[transfer-fallback] recording:", recordingUrl, "duration:", recordingDuration, "from:", from);
      try {
        await supabaseAdmin.from("notifications").insert({
          business_id: businessId, type: "call",
          title: "Nowa wiadomość głosowa",
          message: `Klient ${from || "nieznany"} zostawił wiadomość (${recordingDuration}s). Odsłuchaj: ${recordingUrl}`,
        });
      } catch {}
      return twiml(`<Say language="pl-PL">Dziękujemy za wiadomość. Przekażemy ją konsultantowi. Do widzenia.</Say><Hangup/>`);
    }

    // First visit — consultant didn't answer
    console.log("[transfer-fallback] consultant didn't answer, offering options to", from);
    try {
      await supabaseAdmin.from("notifications").insert({
        business_id: businessId, type: "call",
        title: "Konsultant nie odebrał",
        message: `Klient ${from || "nieznany"} czekał na konsultanta, ale nikt nie odebrał.`,
      });
    } catch (e) { console.warn("[transfer-fallback] notification insert failed:", e); }

    const actionUrl = `${baseUrl}/api/twilio/transfer-fallback?businessId=${encodeURIComponent(businessId)}`;
    return twiml(`
      <Say language="pl-PL">Niestety konsultant jest teraz niedostępny.</Say>
      <Gather numDigits="1" action="${esc(actionUrl)}" method="POST" timeout="10">
        <Say language="pl-PL">
          Naciśnij 1, aby zostawić wiadomość.
          Naciśnij 2, aby otrzymać SMS z informacjami.
          Naciśnij 3, aby poprosić o oddzwonienie.
          Naciśnij 0, aby zakończyć.
        </Say>
      </Gather>
      <Say language="pl-PL">Nie otrzymaliśmy wyboru. Dziękujemy.</Say>
      <Hangup/>
    `);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[transfer-fallback] error:", msg);
    return twiml(`<Say language="pl-PL">Przepraszamy, wystąpił błąd. Dziękujemy za rozmowę.</Say><Hangup/>`);
  }
}

import { NextResponse } from "next/server";
import { registerTransferFallback, escapeXml } from "@/lib/twilio-utils";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
    try {
      await supabaseAdmin.from("notifications").insert({
        business_id: businessId,
        type: "call",
        title: "Konsultant nie odebrał",
        message: `Klient ${from || "nieznany"} czekał na konsultanta, ale nikt nie odebrał. Maja wróci do rozmowy.`,
      });
    } catch (e) {
      console.warn("[transfer-fallback] notification insert failed:", e);
    }

    // Uruchom ponownie Maje z informacją o nieudanym transferze
    // Maja powie: "Przepraszam, konsultant jest teraz niedostępny. Czy mogę w czymś pomóc? Mogę też zapisać wiadomość."
    const xml = await registerTransferFallback(from, to, businessId);

    return new NextResponse(xml, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[transfer-fallback] failed:", msg);

    // Ostateczny fallback — voicemail
    const baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl").replace(/\/+$/, "");
    const businessId = new URL(request.url).searchParams.get("businessId") || "00000000-0000-0000-0000-000000000001";
    const voicemailUrl = `${baseUrl}/api/twilio/voicemail?businessId=${encodeURIComponent(businessId)}`;
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

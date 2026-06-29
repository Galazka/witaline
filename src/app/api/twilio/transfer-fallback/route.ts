import { NextResponse } from "next/server";
import { registerTransferFallback } from "@/lib/twilio-utils";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

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
    const businessId = url.searchParams.get("businessId") || WITALINE_MAIN_BUSINESS_ID;

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

    return twiml("<Say language=\"pl-PL\">Przepraszamy, konsultant jest obecnie niedostępny. Dziękujemy za rozmowę.</Say><Hangup/>");
  }
}

import { NextResponse } from "next/server";
import { registerTransferFallback } from "@/lib/twilio-utils";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pl-PL">Przepraszamy, wystąpił problem. Proszę spróbować później.</Say><Hangup/></Response>`, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }
}
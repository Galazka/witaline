import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

export async function POST(request: Request) {
   try {
     const formData = await request.formData();
     const from = String(formData.get("From") || "");
     const to = String(formData.get("To") || "");

     const url = new URL(request.url);
     const businessId = url.searchParams.get("businessId") || WITALINE_MAIN_BUSINESS_ID;
     const fromNumber = url.searchParams.get("fromNumber") || from;

     console.log("[after-conference-thanks] consultant ended conversation, sending thanks for", fromNumber);

     try {
       await supabaseAdmin.from("notifications").insert({
         business_id: businessId,
         type: "call",
         title: "Rozmowa z konsultantem zakończona",
         message: `Klient ${fromNumber || "nieznany"} zakończył rozmowę z konsultantem. WitaLine dziękuje.`,
       });
     } catch (e) {
       console.warn("[after-conference-thanks] notification insert failed:", e);
     }

     return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pl-PL">Dziękujemy za rozmowę z konsultantem. Do widzenia.</Say><Hangup/></Response>`, {
       status: 200,
       headers: { "Content-Type": "application/xml" },
     });
   } catch (err) {
     const msg = err instanceof Error ? err.message : String(err);
     console.error("[after-conference-thanks] failed:", msg);

     return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pl-PL">Dziękujemy za rozmowę z konsultantem. Do widzenia.</Say><Hangup/></Response>`, {
       status: 200,
       headers: { "Content-Type": "application/xml" },
     });
   }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limit: 5 requests per minute per IP (anti-spam)
  const rl = rateLimitResponse(request, "contact", { windowMs: 60_000, maxRequests: 5 });
  if (rl) return rl;

  try {
    const { company, contact, message, website } = await request.json();

    if (!company || !contact || !message) {
      return NextResponse.json({ error: "Wypełnij wymagane pola: nazwa firmy, telefon/email, wiadomość" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        company: company.trim(),
        contact: contact.trim(),
        message: message.trim(),
        website: website?.trim() || null,
        read: false,
      });

    if (error) {
      console.error("Contact insert error:", error);
      return NextResponse.json({ error: "Nie udało się wysłać wiadomości. Spróbuj ponownie." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Nie udało się przetworzyć zapytania." }, { status: 500 });
  }
}

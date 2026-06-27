import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { setPendingTransfer } from "@/lib/transfer-store";

/** Szukasz konsultanta lub numeru dla danej firmy.
 *  Jeśli firma NIE ma skonfigurowanego numeru konsultanta:
 *  - Zwraca numer WitaLine (main line) → agent Rob/Maja poda się jako konsultant wewnętrzny
 *  - Następnie agent pokaże wiedzę o tej konkretnej firmie (prompt, usługi, ceny) */
async function resolveTargetNumber(businessId: string): Promise<{ number: string; businessName: string; callerId: string; hasHumanConsultant: boolean } | null> {
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, name, phone, twilio_number")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return null;

  const { data: consultants } = await supabaseAdmin
    .from("business_consultants")
    .select("phone")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  // Jeśli firma ma własnych konsultantów → użyj ich numeru
  if (consultants && consultants.length > 0) {
    return {
      number: consultants[0].phone,
      businessName: business.name || "WitaLine",
      callerId: business.twilio_number || process.env.TWILIO_PHONE_NUMBER || "",
      hasHumanConsultant: true,
    };
  }

  // Brak konsultanta → numer WitaLine, ale to nie jest prawdziwy transfer
  const defaultNumber = process.env.WITALINE_CONSULTANT_NUMBER || process.env.TWILIO_PHONE_NUMBER || "";
  if (!defaultNumber) return null;

  return {
    number: defaultNumber,
    businessName: business.name || "WitaLine",
    callerId: business.twilio_number || process.env.TWILIO_PHONE_NUMBER || "",
    hasHumanConsultant: false,
  };
}

/* Obsługa GET — dla ElevenLabs system tool transfer_to_number (webhook) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id") || searchParams.get("businessId") || "";
  if (!businessId) {
    return NextResponse.json({ number: process.env.WITALINE_CONSULTANT_NUMBER || "" });
  }
  const target = await resolveTargetNumber(businessId);
  if (!target) {
    return NextResponse.json({ number: process.env.WITALINE_CONSULTANT_NUMBER || "" });
  }
  return NextResponse.json({ number: target.number });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    console.log("[transfer-human] received:", JSON.stringify(body).slice(0, 300));

    const businessId = body.business_id || body.dynamic_vars?.business_id;
    const callerPhone = body.caller_phone || body.dynamic_vars?.caller_phone || "";
    const toNumber = body.to_number || body.dynamic_vars?.to_number || "";
    const callSid = body.call_sid || body.dynamic_vars?.call_sid || "";

    if (!businessId) {
      return NextResponse.json({ ok: false, message: "Missing business_id" }, { status: 400 });
    }

    const target = await resolveTargetNumber(businessId);
    if (!target) {
      return NextResponse.json({ ok: false, message: "No consultant number configured." }, { status: 400 });
    }

    // System tool `transfer_to_number` — zwróć tylko numer
    if (body.agent_id && !body.caller_phone && !body.to_number) {
      console.log("[transfer-human] system tool → number:", target.number);
      return NextResponse.json({ number: target.number });
    }

    // Custom tool: zapisz zamiar transferu w shared store TYLKO gdy jest prawdziwy konsultant
    // Stream zakończy się naturalnie → Twilio wykona <Redirect> → transfer-router sprawdzi store
    if (target.hasHumanConsultant) {
      const storeKey = callSid || businessId;
      await setPendingTransfer(storeKey, {
        businessId,
        targetNumber: target.number,
        callerId: target.callerId,
        businessName: target.businessName,
        fromNumber: callerPhone,
        toNumber,
        createdAt: Date.now(),
      });

      console.log("[transfer-human] transfer stored for", storeKey, "→", target.number);

      // Create support conversation
      try {
        await supabaseAdmin.from("support_conversations").insert({
          business_id: businessId,
          customer_phone: callerPhone || null,
          customer_name: null,
          source: "transfer",
          status: "open",
        });
        console.log("[transfer-human] support conversation created");
      } catch (convErr) {
        console.warn("[transfer-human] failed to create support conversation:", convErr);
      }
    } else {
      console.log("[transfer-human] no human consultant for", businessId, "- agent continues without transfer");
    }

    return NextResponse.json({
      ok: true,
      target: target.number,
      business: target.businessName,
      has_human_consultant: target.hasHumanConsultant,
      message: target.hasHumanConsultant
        ? `Transfer initiated to ${target.number}. Caller will be connected when Stream ends.`
        : "Brak konsultanta w tej firmie. Agent pozostanie w rozmowie.",
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[transfer-human] failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
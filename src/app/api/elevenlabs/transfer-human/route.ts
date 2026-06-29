import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { setPendingTransfer } from "@/lib/transfer-store";

/** Szukasz konsultanta lub numeru dla danej firmy. */
async function resolveTargetNumber(businessId: string): Promise<{ number: string; businessName: string; callerId: string; hasHumanConsultant: boolean; consultants: { phone: string }[] } | null> {
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

  const consultantList = consultants || [];

  if (consultantList.length > 0) {
    return {
      number: consultantList[0].phone,
      businessName: business.name || "WitaLine",
      callerId: business.twilio_number || process.env.TWILIO_PHONE_NUMBER || "",
      hasHumanConsultant: true,
      consultants: consultantList,
    };
  }

  const defaultNumber = process.env.WITALINE_CONSULTANT_NUMBER || process.env.TWILIO_PHONE_NUMBER || "";
  if (!defaultNumber) return null;

  return {
    number: defaultNumber,
    businessName: business.name || "WitaLine",
    callerId: business.twilio_number || process.env.TWILIO_PHONE_NUMBER || "",
    hasHumanConsultant: false,
    consultants: [],
  };
}

/* GET — dla ElevenLabs system tool transfer_to_number */
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

    // Zapisz pending transfer — transfer-router przejmie po zakończeniu streamu ElevenLabs
    // Stream kończy się gdy agent (Maja) zakończy rozmowę po wywołaniu tego narzędzia
    const storeKey = callSid || businessId;
    const pending = {
      businessId,
      targetNumber: target.number,
      callerId: target.callerId,
      businessName: target.businessName,
      fromNumber: callerPhone,
      toNumber,
      createdAt: Date.now(),
    };
    await setPendingTransfer(storeKey, pending);
    console.log("[transfer-human] saved pending transfer:", pending.targetNumber);

    // Utwórz support conversation
    try {
      await supabaseAdmin.from("support_conversations").insert({
        business_id: businessId,
        customer_phone: callerPhone || null,
        customer_name: null,
        source: "transfer",
        status: "open",
      });
    } catch (convErr) {
      console.warn("[transfer-human] failed to create support conversation:", convErr);
    }

    // Nie próbujemy redirectu REST API — ElevenLabs <Connect> nie pozwala na
    // przerwanie strumienia. Agent musi zakończyć rozmowę, wtedy <Redirect>
    // wstrzyknięty w connectToAgent przekaże do transfer-router.
    return NextResponse.json({
      ok: true,
      target: target.number,
      business: target.businessName,
      has_human_consultant: target.hasHumanConsultant,
      message: `Transfer do ${target.number}. PO UKOŃCZENIU TEGO NARZĘDZIA KONIECZNIE zakończ rozmowę (end_call) — system przekieruje połączenie automatycznie.`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[transfer-human] failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

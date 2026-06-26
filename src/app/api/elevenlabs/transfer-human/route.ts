import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { setPendingTransfer } from "@/lib/transfer-store";

/** Szuka konsultanta lub numeru dla danej firmy */
async function resolveTargetNumber(businessId: string): Promise<{ number: string; businessName: string; callerId: string } | null> {
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

  let targetNumber = "";
  if (consultants && consultants.length > 0) {
    targetNumber = consultants[0].phone;
  } else {
    targetNumber = business.phone || process.env.WITALINE_CONSULTANT_NUMBER || "";
  }

  if (!targetNumber) return null;

  return {
    number: targetNumber,
    businessName: business.name || "WitaLine",
    callerId: business.twilio_number || process.env.TWILIO_PHONE_NUMBER || "",
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

    // Custom tool: zapisz zamiar transferu w shared store
    // Stream zakończy się naturalnie → Twilio wykona <Redirect> → transfer-router sprawdzi store
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

    return NextResponse.json({
      ok: true,
      target: target.number,
      business: target.businessName,
      message: `Transfer initiated to ${target.number}. Caller will be connected when Stream ends.`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[transfer-human] failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { setPendingTransfer } from "@/lib/transfer-store";
import { redirectActiveCallToHumanHandoff, escapeXml } from "@/lib/twilio-utils";

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

    // Zapisz pending transfer (dla fallbacku i tracking)
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

    // === NATYCHMIASTOWY REDIRECT AKTYWNEGO POŁĄCZENIA ===
    // Gdy target.number istnieje (konsultant lub fallback), zawsze redirect
    if (callSid && target.number) {
      const baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl").replace(/\/+$/, "");
      const queueName = `handoff_${callSid}`;
      const holdMusicUrl = process.env.HOLD_MUSIC_URL || "https://cdn.witaline.app/hold-music.mp3";
      const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${encodeURIComponent(businessId)}&callSid=${encodeURIComponent(callSid)}`;
      const fallbackUrl = `${baseUrl}/api/twilio/transfer-fallback?businessId=${encodeURIComponent(businessId)}`;

      const redirectTwiml = `
<Say language="pl-PL">Proszę chwilę poczekać. Łączę z konsultantem.</Say>
<Enqueue waitUrl="${escapeXml(holdMusicUrl)}" action="${escapeXml(actionUrl)}" method="POST">
  ${escapeXml(queueName)}
</Enqueue>
<Redirect method="POST">${escapeXml(fallbackUrl)}</Redirect>`;

      console.log("[transfer-human] redirecting active call", callSid, "→ queue", queueName, "target:", target.number);
      const redirectResult = await redirectActiveCallToHumanHandoff(callSid, redirectTwiml, businessId);

      if (redirectResult.ok) {
        console.log("[transfer-human] redirect OK, dialling consultant");

        // Wydzwonij konsultanta do kolejki (asynchronicznie)
        const { dialConsultantToQueue } = await import("@/lib/twilio-utils");
        dialConsultantToQueue(target.number, target.callerId, queueName, baseUrl, businessId, callSid)
          .then(r => console.log("[transfer-human] consultant dial result:", r))
          .catch(err => console.error("[transfer-human] consultant dial failed:", err));

        return NextResponse.json({
          ok: true,
          target: target.number,
          business: target.businessName,
          has_human_consultant: target.hasHumanConsultant,
          redirected: true,
          message: `Przekazuję do konsultanta ${target.number}. Połączenie zostało przekierowane.`,
        });
      } else {
        console.error("[transfer-human] redirect failed:", redirectResult.message);
        // Fallback: agent kończy rozmowę, transfer-router przejmie po zakończeniu streamu
        return NextResponse.json({
          ok: true,
          target: target.number,
          business: target.businessName,
          has_human_consultant: target.hasHumanConsultant,
          redirected: false,
          message: `Transfer do ${target.number}. Pożegnaj się i zakończ rozmowę — system przekieruje połączenie.`,
        });
      }
    }

    // Brak callSid — nie można zrobić REST API redirect
    return NextResponse.json({
      ok: true,
      target: target.number,
      business: target.businessName,
      has_human_consultant: target.hasHumanConsultant,
      redirected: false,
      message: target.hasHumanConsultant
        ? `Transfer do ${target.number}. Pożegnaj się i zakończ rozmowę.`
        : `Przekazuję do konsultanta ${target.number}. Nie znam tego numeru, ale system go wybierze po zakończeniu rozmowy.`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[transfer-human] failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirectActiveCallToHumanHandoff } from "@/lib/twilio-utils";

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

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

/** Szuka aktywnego połączenia Twilio — najpierw po numerze Twilio, potem po dzwoniącym */
async function findCallSid(fromNumber: string, toNumber: string, businessId: string): Promise<string | null> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const ourNumber = process.env.TWILIO_PHONE_NUMBER || "+48732125752";
  if (!sid || !token) return null;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  // 1. Szukaj po naszym numerze (To) — to najpewniejsze
  const toVariants = [ourNumber, ourNumber.replace(/^\+/, ""), ourNumber.replace(/\D/g, "")];
  if (toNumber) toVariants.push(toNumber, toNumber.replace(/^\+/, ""), toNumber.replace(/\D/g, ""));

  for (const status of ["in-progress", "ringing", "queued"]) {
    for (const to of [...new Set(toVariants)]) {
      if (!to) continue;
      try {
        const sp = new URLSearchParams({ To: to, Status: status, PageSize: "5" });
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json?${sp}`, {
          headers: { Authorization: `Basic ${auth}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.calls?.length) {
            // Weź najnowsze połączenie
            return data.calls.sort((a: any, b: any) => 
              new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
            )[0].sid;
          }
        }
      } catch { /* ignore */ }
    }
  }

  // 2. Szukaj po dzwoniącym (w różnych formatach)
  if (fromNumber) {
    const fromVariants = [fromNumber, fromNumber.replace(/^\+/, ""), fromNumber.replace(/\D/g, "")];
    for (const status of ["in-progress", "ringing", "queued"]) {
      for (const f of [...new Set(fromVariants)]) {
        if (!f) continue;
        try {
          const sp = new URLSearchParams({ From: f, Status: status, PageSize: "1" });
          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json?${sp}`, {
            headers: { Authorization: `Basic ${auth}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.calls?.[0]?.sid) return data.calls[0].sid;
          }
        } catch { /* ignore */ }
      }
    }
  }

  console.log("[transfer-human] findCallSid: not found for", fromNumber, toNumber, businessId);
  return null;
}

/** Obsługa GET — dla ElevenLabs system tool transfer_to_number (webhook) */
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

    // ── Odczytaj parametry z różnych formatów ──
    const businessId = body.business_id || body.dynamic_vars?.business_id;
    const callerPhone = body.caller_phone || body.dynamic_vars?.caller_phone || "";
    const toNumber = body.to_number || body.dynamic_vars?.to_number || "";
    const callSid = body.call_sid || body.dynamic_vars?.call_sid || "";

    if (!businessId) {
      return NextResponse.json({ ok: false, message: "Missing business_id" }, { status: 400 });
    }

    // ── Znajdź numer konsultanta ──
    const target = await resolveTargetNumber(businessId);
    if (!target) {
      return NextResponse.json({ ok: false, message: "No consultant number configured. Set business.phone or add consultants." }, { status: 400 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const nextUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${businessId}&idx=1`;

    // ── System tool `transfer_to_number` ── zwróć tylko numer ──
    if (body.agent_id && !body.caller_phone && !body.to_number) {
      console.log("[transfer-human] system tool → number:", target.number);
      return NextResponse.json({ number: target.number });
    }

    // ── Custom tool ── znajdź i przekieruj połączenie ──
    const foundSid = callSid || await findCallSid(callerPhone, toNumber, businessId);

    if (foundSid) {
      const handoffXml = `
        <Say language="pl-PL">Przekazuj\u0119 po\u0142\u0105czenie do konsultanta. Prosz\u0119 czeka\u0107.</Say>
        <Dial callerId="${escapeXml(target.callerId)}" timeout="20" action="${escapeXml(nextUrl)}" method="POST">
          <Number>${escapeXml(target.number)}</Number>
        </Dial>
        <Say language="pl-PL">Konsultant nie odbiera. Oddzwonimy.</Say>
        <Hangup/>
      `;

      console.log("[transfer-human] redirecting call", foundSid, "→", target.number);
      const redirect = await redirectActiveCallToHumanHandoff(foundSid, handoffXml);

      return NextResponse.json({
        ok: redirect.ok,
        call_sid: foundSid,
        target: target.number,
        message: redirect.message,
      }, { status: redirect.ok ? 200 : 502 });
    }

    // ── Nie znaleziono aktywnego połączenia ── callback ──
    // Zapisz prośbę o callback do DB
    await supabaseAdmin.from("notifications").insert({
      business_id: businessId,
      type: "call",
      title: "Prośba o kontakt z konsultantem",
      message: `Klient ${callerPhone || "nieznany"} prosił o rozmowę z konsultantem (${target.businessName}). Numer konsultanta: ${target.number}.`,
    }).maybeSingle();

    console.log("[transfer-human] no active call found — saved callback request for", callerPhone);
    return NextResponse.json({
      ok: true,
      target: target.number,
      business: target.businessName,
      message: `Numer konsultanta: ${target.number}. Nie znaleziono aktywnego połączenia do przekierowania — zapisano prośbę o callback.`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[transfer-human] failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
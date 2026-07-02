import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPlanConfig } from "@/lib/pricing";
import { twiml, escapeXml } from "@/lib/twilio-utils";
import { sendSms } from "@/lib/twilio-sms";
import { sendTrialExpiredEmail, getTrialExpiredSmsText } from "@/lib/email";
import { WITALINE_MAIN_BUSINESS_ID, WITALINE_PHONE_NUMBER } from "@/lib/constants";
import type { PlanKey } from "@/types/database";

function isSpam(addOns: string | null): boolean {
  if (!addOns) return false;
  try {
    const parsed = JSON.parse(addOns);
    const results = parsed.results || {};
    const nomorobo = results.nomorobo_spamscore?.result?.score;
    if (nomorobo === 1) return true;
    const marchex = results.marchex_cleancall?.result?.result?.recommendation;
    if (marchex === "BLOCK") return true;
  } catch {}
  return false;
}

export async function GET() {
  return new NextResponse(
    `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
      <h1 style="color:#72B176">WitaLine — Twilio Webhook</h1>
      <p>Endpoint dla polaczen przychodzacych Twilio.</p>
      <p style="color:#888">Ten URL skonfiguruj w Twilio Console → Phone Numbers → A call comes in.</p>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const twilioNumber = formData.get("To") as string;
  const callerId = formData.get("From") as string;
  const callSid = formData.get("CallSid") as string;
  const addOns = formData.get("AddOns") as string | null;
  const mainNumber = process.env.TWILIO_PHONE_NUMBER || WITALINE_PHONE_NUMBER;

  console.log("[incoming] Call received:", { twilioNumber, callerId, callSid, isMain: twilioNumber === mainNumber });

  // 1. Spam filtering
  if (isSpam(addOns)) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Reject /></Response>`,
      { status: 200, headers: { "Content-Type": "application/xml" } }
    );
  }

  // 2. Log call attempt
  const isMain = twilioNumber === mainNumber;
  try {
    await supabaseAdmin.from("call_logs").insert({
      business_id: isMain ? null : null,
      twilio_call_sid: callSid,
      from_number: callerId || "",
      to_number: twilioNumber,
      routed_from_main: isMain,
      started_at: new Date().toISOString(),
      duration_seconds: 0,
      cost_pln: 0,
      classification: "inquiry",
      caller_id: callerId || "unknown",
      rodo_consent_played: true,
      rodo_consent_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[incoming] Failed to log call attempt:", err);
  }

  // 3. RODO consent message
  const rodoMsg = "Witamy w WitaLine. Rozmowa jest nagrywana i analizowana przez AI. Kontynuujac, wyrazaja Panstwo zgode. W przeciwnym razie prosze sie rozlaczyc.";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (twilioNumber === mainNumber) {
    const redirectUrl = `${appUrl}/api/twilio/connect?businessId=${WITALINE_MAIN_BUSINESS_ID}&callSid=${callSid}&from=${callerId}&to=${twilioNumber}&name=WitaLine`;
    console.log("[incoming] Redirect URL:", redirectUrl);

    // Use <Gather> instead of <Redirect> — Twilio will POST to action URL after Say finishes + timeout
    return twiml(
      `<Gather input="dtmf" timeout="2" action="${escapeXml(redirectUrl)}" method="POST">
        <Say language="pl-PL">${escapeXml(rodoMsg)}</Say>
      </Gather>`
    );
  }

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("twilio_number", twilioNumber)
    .single();

  if (!business) {
    return twiml(`<Say language="pl-PL">Przepraszamy, numer nie jest przypisany do zadnej firmy.</Say><Hangup/>`);
  }

  if (business.suspended) {
    return twiml(
      `<Say language="pl-PL">Przepraszamy, konto firmy ${escapeXml(business.name)} jest chwilowo nieaktywne. Prosimy o kontakt z administratorem.</Say><Hangup/>`
    );
  }

  // Trial limit check — block if trial expired or minutes exceeded
  const TRIAL_MAX_MINUTES = 15;
  if (business.subscription_status === "trialing") {
    const trialExpired = business.trial_ends_at && new Date(business.trial_ends_at) < new Date();
    const trialMinutesExceeded = (business.trial_minutes_used || 0) >= TRIAL_MAX_MINUTES;
    if (trialExpired || trialMinutesExceeded) {
      sendSms(callerId, getTrialExpiredSmsText(), undefined, business.id).catch(e =>
        console.error("[incoming] trial-block sms error:", e)
      );
      if (business.owner_email) {
        sendTrialExpiredEmail(business.owner_email, business.name || "Firma").catch(e =>
          console.error("[incoming] trial-block email error:", e)
        );
      }
      return twiml(`<Say language="pl-PL">Okres probny wygasl. Wyslismy SMS z linkiem do doładowania konta. Dziekujemy.</Say><Hangup/>`);
    }
  }

  const config = getPlanConfig(business.current_plan as PlanKey);
  if (business.minutes_used_this_week >= config.monthlyVoiceMinutes) {
    if (business.current_plan !== "elastic_0" && business.current_plan !== "enterprise_2000" && business.current_plan !== "lux_599") {
      return twiml(
        `<Say language="pl-PL">Przepraszamy, firma ${escapeXml(business.name)} wyczerpala limit minut na ten tydzien. Prosimy zadzwonic pozniej.</Say><Hangup/>`
      );
    }
  }

  try {
    await supabaseAdmin.from("call_logs")
      .update({ business_id: business.id, routed_business_name: business.name })
      .eq("twilio_call_sid", callSid)
      .is("business_id", null);
  } catch (err) {
    console.error("[incoming] Failed to update call attempt with business_id:", err);
  }

  const redirectUrl = `${appUrl}/api/twilio/connect?businessId=${business.id}&callSid=${callSid}&from=${callerId}&to=${twilioNumber}&name=${business.name}`;
  console.log("[incoming] Redirect URL:", redirectUrl);

  return twiml(
    `<Gather input="dtmf" timeout="2" action="${escapeXml(redirectUrl)}" method="POST">
      <Say language="pl-PL">${escapeXml(rodoMsg)}</Say>
    </Gather>`
  );
}

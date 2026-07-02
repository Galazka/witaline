import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { connectToAgent, twiml } from "@/lib/twilio-utils";
import { sendSms } from "@/lib/twilio-sms";
import { sendTrialExpiredEmail, getTrialExpiredSmsText } from "@/lib/email";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

const CALL_LIMIT_PER_NUMBER = 5;
const WINDOW_SECONDS = 60;

// In-memory IP rate limiter (resets on server restart — fine for Twilio)
const ipHits = new Map<string, number[]>();

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const window = ipHits.get(ip) || [];
  const recent = window.filter(t => now - t < WINDOW_SECONDS * 1000);
  if (recent.length >= 10) return true; // max 10 req/min per IP
  recent.push(now);
  ipHits.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const from = (formData.get("From") as string) || "";
  const to = (formData.get("To") as string) || "";
  const callSid = (formData.get("CallSid") as string) || "";
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

  // 0. IP rate limit — blocks spoofed caller IDs
  if (isIpRateLimited(clientIp)) {
    console.log("[spam-filter] IP rate limited:", clientIp);
    return twimlReject();
  }

  const caller = from.replace(/^\+/, "").replace(/\D/g, "");

  // 1. Block non-Polish numbers
  if (!caller.startsWith("48")) {
    console.log("[spam-filter] blocked non-PL:", from);
    return twimlReject();
  }

  // 2. Check blocklist
  const { data: blocked } = await supabaseAdmin
    .from("blocked_callers")
    .select("id")
    .eq("phone", caller)
    .maybeSingle();

  if (blocked) {
    console.log("[spam-filter] blocked caller in blocklist:", from);
    return twimlReject();
  }

  // 3. Rate limit - count calls from this number in last 60s
  const since = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("call_logs")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("caller_id", caller)
    .gte("created_at", since);

  if (count && count >= CALL_LIMIT_PER_NUMBER) {
    console.log("[spam-filter] rate limited:", from, count);
    return twimlReject();
  }

  // 4. Look up business by the Twilio number being called
  let businessId = WITALINE_MAIN_BUSINESS_ID;
  let businessName = "WitaLine";
  let voiceId: string | undefined;
  let voiceName: string | undefined;
  let trialMinutesRemaining: number | undefined;
  let prepaidMinutesRemaining: number | undefined;

  const toClean = to.replace(/^\+/, "").replace(/\D/g, "");
  if (toClean) {
    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("id, name, voice_id, owner_email, trial_ends_at, subscription_status, trial_minutes_used, prepaid_minutes")
      .eq("twilio_number", toClean)
      .maybeSingle();

    if (biz) {
      businessId = biz.id;
      businessName = biz.name || "WitaLine";

      const TRIAL_MAX_MINUTES = 15;

      if (biz.subscription_status === "trialing") {
        const trialExpired = biz.trial_ends_at && new Date(biz.trial_ends_at) < new Date();
        const trialMinutesUsed = biz.trial_minutes_used || 0;
        const trialMinutesExceeded = trialMinutesUsed >= TRIAL_MAX_MINUTES;
        trialMinutesRemaining = Math.max(0, TRIAL_MAX_MINUTES - trialMinutesUsed);

        if (trialExpired || trialMinutesExceeded) {
          sendSms(from, getTrialExpiredSmsText(), undefined, businessId).catch(e =>
            console.error("[spam-filter] trial-block sms error:", e)
          );
          if (biz.owner_email) {
            sendTrialExpiredEmail(biz.owner_email, biz.name || "Firma").catch(e =>
              console.error("[spam-filter] trial-block email error:", e)
            );
          }
          return twiml(`<Say language="pl-PL">Okres probny wygasl. Wyslismy SMS z linkiem do doładowania konta. Dziekujemy.</Say><Hangup/>`);
        }
      }

      // Check prepaid minutes for non-trialing businesses
      if (biz.subscription_status !== "trialing") {
        prepaidMinutesRemaining = parseFloat(String(biz.prepaid_minutes || "0"));
        if (prepaidMinutesRemaining <= 0) {
          console.log("[spam-filter] blocked — no prepaid minutes left:", businessId, biz.name);
          return twiml(`<Say language="pl-PL">Przepraszamy, konto nie ma wystarczajacych srodkow. Doladuj konto w panelu WitaLine.</Say><Hangup/>`);
        }
      }

      if (biz.voice_id) {
        const { data: voice } = await supabaseAdmin
          .from("voices")
          .select("elevenlabs_voice_id, display_name")
          .eq("id", biz.voice_id)
          .maybeSingle();

        if (voice) {
          voiceId = voice.elevenlabs_voice_id;
          voiceName = voice.display_name;
        }
      }
    }
  }

  // 5. Register call with ElevenLabs and return TwiML
  console.log("[spam-filter] registering call:", { from, to, callSid, businessId, voiceId });

  // Pass the request origin as baseUrlOverride so the TwiML <Redirect> uses the correct URL
  const host = request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : undefined;

  return connectToAgent(
    null,
    businessName,
    businessId,
    callSid,
    from,
    to,
    voiceId,
    voiceName,
    origin,
    trialMinutesRemaining,
    prepaidMinutesRemaining
  );
}

function twimlReject() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Reject reason="rejected" />
</Response>`;
  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

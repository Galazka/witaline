import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { connectToAgent, twiml } from "@/lib/twilio-utils";

const CALL_LIMIT_PER_NUMBER = 5;
const WINDOW_SECONDS = 60;
const WITALINE_MAIN_BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

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

  const toClean = to.replace(/^\+/, "").replace(/\D/g, "");
  if (toClean) {
    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("id, name, voice_id, trial_ends_at, subscription_status")
      .eq("twilio_number", toClean)
      .maybeSingle();

    if (biz) {
      businessId = biz.id;
      businessName = biz.name || "WitaLine";

      // Block calls for expired trials
      if (
        biz.subscription_status === "trialing" &&
        biz.trial_ends_at &&
        new Date(biz.trial_ends_at) < new Date()
      ) {
        return twiml(`<Say language="pl-PL">Numer jest obecnie nieaktywny. Aby odnowić usługę, odwiedź witaline.pl. Dziękujemy.</Say><Hangup/>`);
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
    origin
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

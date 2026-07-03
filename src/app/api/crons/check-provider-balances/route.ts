import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CRON_SECRET = process.env.CRON_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EL_LOW_THRESHOLD = 10000;
const EL_CRITICAL_THRESHOLD = 1000;
const TW_LOW_THRESHOLD = 20;
const TW_CRITICAL_THRESHOLD = 5;

interface ProviderAlert {
  provider: "elevenlabs" | "twilio";
  level: "low" | "critical";
  message: string;
}

export async function POST(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("x-internal-secret") || req.headers.get("x-cron-secret");
  if (authHeader !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;

  const alerts: ProviderAlert[] = [];

  if (elevenlabsApiKey) {
    try {
      const userRes = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: { "xi-api-key": elevenlabsApiKey },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        const sub = userData.subscription || {};
        const remaining = Math.max(0, (sub.character_limit || 0) - (sub.character_count || 0));

        if (remaining <= EL_CRITICAL_THRESHOLD) {
          alerts.push({
            provider: "elevenlabs",
            level: "critical",
            message: "Bardzo niski poziom znaków - uzupełnij konto",
          });
        } else if (remaining <= EL_LOW_THRESHOLD) {
          alerts.push({
            provider: "elevenlabs",
            level: "low",
            message: "Niski poziom znaków",
          });
        }
      }
    } catch {
      // ignore
    }
  }

  if (twilioSid && twilioToken) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const balRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Balance.json`,
        { headers: { Authorization: `Basic ${auth}` } }
      );

      if (balRes.ok) {
        const balData = await balRes.json();
        const balance = Number(balData.balance) || 0;

        if (balance <= TW_CRITICAL_THRESHOLD) {
          alerts.push({
            provider: "twilio",
            level: "critical",
            message: "Bardzo niski stan konta - uzupełnij środki",
          });
        } else if (balance <= TW_LOW_THRESHOLD) {
          alerts.push({
            provider: "twilio",
            level: "low",
            message: "Niski stan konta Twilio",
          });
        }
      }
    } catch {
      // ignore
    }
  }

  if (alerts.length > 0 && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    for (const alert of alerts) {
      await supabase.from("notifications").insert({
        business_id: "00000000-0000-0000-0000-000000000001",
        type: "system",
        title: `Alert: ${alert.provider === "elevenlabs" ? "ElevenLabs" : "Twilio"}`,
        message: alert.message,
        read: false,
      });
    }
  }

  return NextResponse.json({ alerts, created: alerts.length });
}
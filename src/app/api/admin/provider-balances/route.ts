import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

const EL_LOW_THRESHOLD = 10000;
const EL_CRITICAL_THRESHOLD = 1000;
const TW_LOW_THRESHOLD = 20;
const TW_CRITICAL_THRESHOLD = 5;

type AlertLevel = "none" | "low" | "critical";

function getAlertLevel(value: number, low: number, critical: number): AlertLevel {
  if (value <= critical) return "critical";
  if (value <= low) return "low";
  return "none";
}

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;

  const results: {
    elevenLabs: {
      characters: number;
      alertLevel: AlertLevel;
      alertMessage?: string;
    };
    twilio: {
      balance: number;
      alertLevel: AlertLevel;
      alertMessage?: string;
    };
  } = {
    elevenLabs: { characters: 0, alertLevel: "none" },
    twilio: { balance: 0, alertLevel: "none" },
  };

  if (elevenlabsApiKey) {
    try {
      const userRes = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: { "xi-api-key": elevenlabsApiKey },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        const sub = userData.subscription || {};
        const characterCount = sub.character_count ?? 0;
        const characterLimit = sub.character_limit ?? 0;
        const remaining = Math.max(0, characterLimit - characterCount);

        const alertLevel = getAlertLevel(remaining, EL_LOW_THRESHOLD, EL_CRITICAL_THRESHOLD);
        
        results.elevenLabs = {
          characters: remaining,
          alertLevel,
          alertMessage: alertLevel === "critical" 
            ? "Bardzo niski poziom znaków - uzupełnij konto"
            : alertLevel === "low"
            ? "Niski poziom znaków"
            : undefined,
        };
      }
    } catch {
      results.elevenLabs = {
        characters: 0,
        alertLevel: "none",
        alertMessage: "Błąd pobierania danych ElevenLabs",
      };
    }
  } else {
    results.elevenLabs = {
      characters: 0,
      alertLevel: "none",
      alertMessage: "ELEVENLABS_API_KEY nie skonfigurowane",
    };
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
        const alertLevel = getAlertLevel(balance, TW_LOW_THRESHOLD, TW_CRITICAL_THRESHOLD);

        results.twilio = {
          balance,
          alertLevel,
          alertMessage: alertLevel === "critical"
            ? "Bardzo niski stan konta - uzupełnij środki"
            : alertLevel === "low"
            ? "Niski stan konta Twilio"
            : undefined,
        };
      }
    } catch {
      results.twilio = {
        balance: 0,
        alertLevel: "none",
        alertMessage: "Błąd pobierania salda Twilio",
      };
    }
  } else {
    results.twilio = {
      balance: 0,
      alertLevel: "none",
      alertMessage: "Dane Twilio nie skonfigurowane",
    };
  }

  return NextResponse.json(results);
}
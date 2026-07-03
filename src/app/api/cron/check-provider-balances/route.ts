import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { addNotification } from "@/lib/notifications";

const EL_LOW_THRESHOLD = 10000;
const EL_CRITICAL_THRESHOLD = 1000;
const TW_LOW_THRESHOLD = 20;
const TW_CRITICAL_THRESHOLD = 5;

function getAlertLevel(value: number, low: number, critical: number): "ok" | "low" | "critical" {
  if (value <= critical) return "critical";
  if (value <= low) return "low";
  return "ok";
}

async function fetchElevenLabsBalance(apiKey: string) {
  const userRes = await fetch("https://api.elevenlabs.io/v1/user", {
    headers: { "xi-api-key": apiKey },
  });
  if (!userRes.ok) return null;
  const userData = await userRes.json();
  const sub = userData.subscription || {};
  return {
    character_count: sub.character_count ?? 0,
    character_limit: sub.character_limit ?? 0,
    tier: userData.tier || sub.tier,
    status: sub.status,
  };
}

async function fetchTwilioBalance(sid: string, token: string) {
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const balRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (!balRes.ok) return null;
  const balData = await balRes.json();
  return {
    balance: Number(balData.balance) || 0,
    currency: balData.currency || "USD",
  };
}

export async function POST(req: Request) {
  const cronSecret = req.headers.get("x-cron-secret") || req.headers.get("x-internal-secret");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || cronSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;

  const notifications: string[] = [];

  // ElevenLabs
  if (elevenlabsApiKey) {
    try {
      const elData = await fetchElevenLabsBalance(elevenlabsApiKey);
      if (elData) {
        const remaining = Math.max(0, (elData.character_limit || 0) - (elData.character_count || 0));
        const level = getAlertLevel(remaining, EL_LOW_THRESHOLD, EL_CRITICAL_THRESHOLD);
        if (level !== "ok") {
          const title = level === "critical"
            ? "KRYTYCZNE: Niskie saldo ElevenLabs"
            : "Uwaga: Niskie saldo ElevenLabs";
          const message = `Pozostało ${remaining.toLocaleString("pl-PL")} znaków (${elData.tier || "brak tier"}).`;
          await addNotification({
            businessId: "00000000-0000-0000-0000-000000000001",
            type: "system",
            title,
            message,
            metadata: { provider: "elevenlabs", remaining, level },
          });
          notifications.push(`elevenlabs:${level}`);
        }
      }
    } catch {
      // ignore
    }
  }

  // Twilio
  if (twilioSid && twilioToken) {
    try {
      const twData = await fetchTwilioBalance(twilioSid, twilioToken);
      if (twData) {
        const level = getAlertLevel(twData.balance, TW_LOW_THRESHOLD, TW_CRITICAL_THRESHOLD);
        if (level !== "ok") {
          const title = level === "critical"
            ? "KRYTYCZNE: Niskie saldo Twilio"
            : "Uwaga: Niskie saldo Twilio";
          const message = `Saldo: ${twData.balance.toFixed(2)} ${twData.currency}.`;
          await addNotification({
            businessId: "00000000-0000-0000-0000-000000000001",
            type: "system",
            title,
            message,
            metadata: { provider: "twilio", balance: twData.balance, level },
          });
          notifications.push(`twilio:${level}`);
        }
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    message: notifications.length > 0
      ? `Utworzono ${notifications.length} powiadomień: ${notifications.join(", ")}`
      : "Salda OK, brak alertów",
    alerts: notifications,
  });
}
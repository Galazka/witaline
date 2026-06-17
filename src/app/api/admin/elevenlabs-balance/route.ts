import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 200, statusText: "OK" });
  }

  try {
    // Get user/subscription info
    const userRes = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": apiKey },
    });

    // Get remaining character/quota info
    const modelsRes = await fetch("https://api.elevenlabs.io/v1/models", {
      headers: { "xi-api-key": apiKey },
    });

    // Get ConvAI usage (minutes used this month)
    const convaiRes = await fetch("https://api.elevenlabs.io/v1/convai/usage", {
      headers: { "xi-api-key": apiKey },
    }).catch(() => null);

    const userData = userRes.ok ? await userRes.json() : null;

    return NextResponse.json({
      user: userData
        ? {
            email: userData.email,
            tier: userData.tier || userData.subscription?.tier,
            status: userData.subscription?.status,
            character_count: userData.subscription?.character_count,
            character_limit: userData.subscription?.character_limit,
          }
        : null,
      convai: convaiRes && convaiRes.ok ? await convaiRes.json() : null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch ElevenLabs data" });
  }
}

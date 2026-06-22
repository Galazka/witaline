import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string | boolean> = {};
  let healthy = true;

  // Database check
  try {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .limit(1);
    checks.database = error ? `error: ${error.message}` : true;
    if (error) healthy = false;
  } catch (e) {
    checks.database = `error: ${e instanceof Error ? e.message : String(e)}`;
    healthy = false;
  }

  // Environment check
  checks.elevenlabs_configured = !!process.env.ELEVENLABS_API_KEY;
  checks.twilio_configured = !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN;
  checks.stripe_configured = !!process.env.STRIPE_SECRET_KEY;
  checks.sentry_configured = !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN;

  const uptime = process.uptime();

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(uptime),
      checks,
      version: process.env.npm_package_version || "1.0.0",
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

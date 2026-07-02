import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ELASTIC_TIERS, INTERNAL_COST_PER_MIN } from "@/lib/pricing";
import { SMS_PACKAGES } from "@/lib/sms-pricing";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

export async function GET(request: Request) {
  const auth = request.headers.get("x-diagnostics-key");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks: Record<string, unknown> = {};
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── 1. Env vars ──
  const envChecks: Record<string, string | undefined> = {
    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ? "***" + process.env.ELEVENLABS_API_KEY.slice(-4) : undefined,
    ELEVENLABS_WEBHOOK_SECRET: process.env.ELEVENLABS_WEBHOOK_SECRET ? "***" + process.env.ELEVENLABS_WEBHOOK_SECRET.slice(-4) : undefined,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.slice(0, 8) + "***" : undefined,
    CRON_SECRET: process.env.CRON_SECRET ? "***" + process.env.CRON_SECRET.slice(-4) : undefined,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "***" : undefined,
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "***" : undefined,
  };
  for (const [key, val] of Object.entries(envChecks)) {
    if (!val) errors.push(`Missing env: ${key}`);
  }
  checks.env = envChecks;

  // ── 2. Supabase connectivity ──
  try {
    const { count } = await supabaseAdmin.from("businesses").select("*", { count: "exact", head: true });
    checks.supabase = { connected: true, businessCount: count };
  } catch (e) {
    errors.push("Supabase connection failed");
    checks.supabase = { connected: false, error: String(e) };
  }

  // ── 3. Businesses with low/negative prepaid ──
  try {
    const { data: businesses } = await supabaseAdmin
      .from("businesses")
      .select("id, name, prepaid_minutes, subscription_status, current_plan")
      .not("id", "eq", WITALINE_MAIN_BUSINESS_ID);
    const lowBalance: Array<{ id: string; name: string; prepaid: number; plan: string }> = [];
    const negativeBalance: Array<{ id: string; name: string; prepaid: number; plan: string }> = [];
    let totalPrepaid = 0;
    let businessCount = 0;
    for (const b of (businesses || [])) {
      const prepaid = parseFloat(String(b.prepaid_minutes || "0"));
      totalPrepaid += prepaid;
      businessCount++;
      if (prepaid < 0) negativeBalance.push({ id: b.id, name: b.name || "?", prepaid, plan: b.current_plan });
      else if (prepaid < 50 && b.subscription_status !== "trialing") lowBalance.push({ id: b.id, name: b.name || "?", prepaid, plan: b.current_plan });
    }
    checks.businesses = { total: businessCount, totalPrepaidMinutes: Math.round(totalPrepaid * 100) / 100, lowBalance, negativeBalance };
    if (negativeBalance.length > 0) errors.push(`Negative prepaid balance for ${negativeBalance.length} businesses`);
    if (lowBalance.length > 5) warnings.push(`${lowBalance.length} businesses have <50 prepaid minutes`);
  } catch (e) {
    errors.push("Failed to query businesses: " + String(e));
  }

  // ── 4. Call logs in last 24h ──
  try {
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: recentCalls } = await supabaseAdmin
      .from("call_logs")
      .select("id, cost_pln, revenue_pln, internal_cost_pln, duration_seconds, business_id")
      .gte("created_at", dayAgo);
    const totalDuration = (recentCalls || []).reduce((s, c) => s + (c.duration_seconds || 0), 0);
    const totalRevenue = (recentCalls || []).reduce((s, c) => s + (c.revenue_pln || 0), 0);
    const totalInternalCost = (recentCalls || []).reduce((s, c) => s + (c.internal_cost_pln || 0), 0);
    checks.calls24h = { count: (recentCalls || []).length, totalMinutes: Math.round(totalDuration / 60), totalRevenuePLN: Math.round(totalRevenue * 100) / 100, totalInternalCostPLN: Math.round(totalInternalCost * 100) / 100 };
  } catch (e) {
    errors.push("Failed to query call_logs: " + String(e));
  }

  // ── 5. Pricing config ──
  checks.pricing = {
    elasticTiers: ELASTIC_TIERS.map(t => `${t.from}-${t.to === Infinity ? "∞" : t.to}: ${t.rate} PLN/min`),
    internalCostPerMin: INTERNAL_COST_PER_MIN,
    smsPackages: SMS_PACKAGES.map(p => `${p.smsCount}SMS: ${p.clientPricePLN.toFixed(2)} PLN brutto (${p.pricePerSmsPLN.toFixed(2)} PLN/sms)`),
  };

  // ── 6. Stripe products check ──
  checks.stripe = {
    buyMinutesEnabled: !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUY_MINUTES,
    buySmsEnabled: !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUY_SMS,
  };

  return NextResponse.json({
    status: errors.length === 0 ? "healthy" : warnings.length > 0 ? "degraded" : "issues",
    timestamp: new Date().toISOString(),
    checks,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}

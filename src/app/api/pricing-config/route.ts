import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DEFAULT_CONFIG = {
  internalCostPerMin: 0.65,
  elasticBaseRate: 2.00,
  elasticStepDecrease: 0.10,
  elasticMinRate: 1.00,
  elasticTierStep: 500,
  elasticStartMin: 50,
  elasticMaxMin: 5000,
  planStart: 299,
  planGrowth: 600,
  planPro: 300,
  planLux: 800,
  planEnterprise: 1500,
  addonOwnNumber: 49,
  addonGoogleCalendar: 39,
  addonCrm: 79,
  addonVoiceClone: 99,
  addonUnlimitedConsultants: 149,
  addonPrioritySupport: 59,
  addonSla247: 199,
  enterpriseSetupFee: 299,
  enterpriseMinMonthly: 1500,
  minMarginPercent: 35,
  overageMultiplier: 1.0,
};

export async function GET() {
  const { data } = await supabaseAdmin
    .from("pricing_config")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  const merged = data ? { ...DEFAULT_CONFIG, ...(data.config as Record<string, unknown>) } : DEFAULT_CONFIG;

  return NextResponse.json({
    config: merged,
    defaults: DEFAULT_CONFIG,
    active_name: data?.name || "Domyślna",
  });
}

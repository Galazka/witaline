import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

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
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { data } = await supabaseAdmin
    .from("pricing_config")
    .select("*")
    .order("created_at", { ascending: false });

  const active = data?.find(c => c.is_active);
  const merged = active ? { ...DEFAULT_CONFIG, ...(active.config as Record<string, unknown>) } : DEFAULT_CONFIG;

  return NextResponse.json({
    configs: data || [],
    active: active || null,
    merged,
    defaults: DEFAULT_CONFIG,
  });
}

export async function POST(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const body = await request.json();
  const { name, config, setActive } = body;

  if (!name || !config) {
    return NextResponse.json({ error: "name and config required" }, { status: 400 });
  }

  const { data, error: insertError } = await supabaseAdmin
    .from("pricing_config")
    .insert({ name, config, is_active: false })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (setActive && data) {
    await supabaseAdmin.from("pricing_config").update({ is_active: false }).neq("id", data.id);
    await supabaseAdmin.from("pricing_config").update({ is_active: true }).eq("id", data.id);
  }

  return NextResponse.json({ ok: true, config: data });
}

export async function PUT(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const body = await request.json();
  const { id, name, config, setActive } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name) updates.name = name;
  if (config) updates.config = config;

  const { data, error: updateError } = await supabaseAdmin
    .from("pricing_config")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (setActive && data) {
    await supabaseAdmin.from("pricing_config").update({ is_active: false }).neq("id", id);
    await supabaseAdmin.from("pricing_config").update({ is_active: true }).eq("id", id);
  }

  return NextResponse.json({ ok: true, config: data });
}

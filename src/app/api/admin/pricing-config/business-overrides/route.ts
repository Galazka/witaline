import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { data } = await supabaseAdmin
    .from("business_pricing_overrides")
    .select("*, businesses(name, current_plan)")
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const body = await request.json();
  const { businessId, overrides } = body;

  if (!businessId || !overrides) {
    return NextResponse.json({ error: "businessId and overrides required" }, { status: 400 });
  }

  const { data, error: upsertError } = await supabaseAdmin
    .from("business_pricing_overrides")
    .upsert({ business_id: businessId, overrides, updated_at: new Date().toISOString() }, { onConflict: "business_id" })
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, override: data });
}

export async function DELETE(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "businessId required" }, { status: 400 });
  }

  await supabaseAdmin.from("business_pricing_overrides").delete().eq("business_id", businessId);

  return NextResponse.json({ ok: true });
}

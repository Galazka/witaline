import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

// List all discount rules
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rules, error } = await supabaseAdmin
    .from("discount_rules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rules);
}

// Create discount rule
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, discount_percent, discount_amount, target_plans, start_at, end_at, max_uses_total } = body;

  if (!name || !start_at || !end_at) {
    return NextResponse.json({ error: "Missing required fields: name, start_at, end_at" }, { status: 400 });
  }

  if (!discount_percent && !discount_amount) {
    return NextResponse.json({ error: "Provide discount_percent or discount_amount" }, { status: 400 });
  }

  if (new Date(end_at) <= new Date(start_at)) {
    return NextResponse.json({ error: "end_at must be after start_at" }, { status: 400 });
  }

  const { data: rule, error } = await supabaseAdmin
    .from("discount_rules")
    .insert({
      name,
      description: description || "",
      discount_percent: discount_percent || null,
      discount_amount: discount_amount || null,
      target_plans: target_plans || [],
      start_at,
      end_at,
      max_uses_total: max_uses_total || 0,
      active: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rule, { status: 201 });
}

// Update discount rule (toggle active)
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("discount_rules")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

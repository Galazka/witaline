import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

// List all coupons
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: coupons, error } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(coupons);
}

// Create coupon
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { code, description, discount_percent, discount_amount, max_uses, valid_from, valid_until, applicable_plans } = body;

  if (!code) {
    return NextResponse.json({ error: "Missing coupon code" }, { status: 400 });
  }

  if (!discount_percent && !discount_amount) {
    return NextResponse.json({ error: "Provide discount_percent or discount_amount" }, { status: 400 });
  }

  const { data: coupon, error } = await supabaseAdmin
    .from("coupons")
    .insert({
      code: code.toUpperCase().trim(),
      description: description || "",
      discount_percent: discount_percent || null,
      discount_amount: discount_amount || null,
      max_uses: max_uses || 0,
      valid_from: valid_from || new Date().toISOString(),
      valid_until: valid_until || null,
      applicable_plans: applicable_plans || [],
      active: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Kupon o tym kodzie już istnieje." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(coupon, { status: 201 });
}

// Update coupon (toggle active, change params)
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing coupon id" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("coupons")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

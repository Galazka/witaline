import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

async function checkAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return supabase;
}

export async function GET(request: Request) {
  const auth = await checkAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const [bizRes, knowRes] = await Promise.all([
      supabaseAdmin.from("businesses").select("*").eq("id", id).single(),
      supabaseAdmin.from("business_knowledge").select("*").eq("business_id", id).order("sort_order"),
    ]);
    if (bizRes.error) return NextResponse.json({ error: bizRes.error.message }, { status: 500 });
    return NextResponse.json({ business: bizRes.data, knowledge: knowRes.data || [] });
  }

  const { data: businesses, error } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = await Promise.all(
    (businesses || []).map(async (b) => {
      const { count: totalCalls } = await supabaseAdmin
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("business_id", b.id);
      const { count: orders } = await supabaseAdmin
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("business_id", b.id)
        .eq("classification", "order");
      return { ...b, stats: { totalCalls: totalCalls || 0, orders: orders || 0 } };
    })
  );

  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const auth = await checkAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, name, system_prompt, menu_catalog, current_plan, suspended, industry, website_url, phone, custom_monthly_revenue, twilio_account_sid, twilio_auth_token } = body;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (system_prompt !== undefined) updateData.system_prompt = system_prompt;
  if (menu_catalog !== undefined) updateData.menu_catalog = menu_catalog;
  if (current_plan !== undefined) updateData.current_plan = current_plan;
  if (suspended !== undefined) updateData.suspended = suspended;
  if (industry !== undefined) updateData.industry = industry;
  if (website_url !== undefined) updateData.website_url = website_url;
  if (phone !== undefined) updateData.phone = phone;
  if (custom_monthly_revenue !== undefined) updateData.custom_monthly_revenue = custom_monthly_revenue;
  if (twilio_account_sid !== undefined) updateData.twilio_account_sid = twilio_account_sid;
  if (twilio_auth_token !== undefined) updateData.twilio_auth_token = twilio_auth_token;

  const { error } = await supabaseAdmin.from("businesses").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const auth = await checkAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Delete related data first, then the business
  await Promise.all([
    supabaseAdmin.from("call_logs").delete().eq("business_id", id),
    supabaseAdmin.from("conversations").delete().eq("business_id", id),
    supabaseAdmin.from("messages").delete().eq("business_id", id),
    supabaseAdmin.from("sms_logs").delete().eq("business_id", id),
    supabaseAdmin.from("reservations").delete().eq("business_id", id),
    supabaseAdmin.from("feedback").delete().eq("business_id", id),
    supabaseAdmin.from("contact_messages").delete().eq("business_id", id),
    supabaseAdmin.from("business_knowledge").delete().eq("business_id", id),
  ]);

  const { error } = await supabaseAdmin.from("businesses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

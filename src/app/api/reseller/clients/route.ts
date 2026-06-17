import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if user is admin (admins can see all reseller clients)
  const isAdmin = user.email === process.env.ADMIN_EMAIL;

  let query = supabaseAdmin
    .from("businesses")
    .select("id, name, current_plan, subscription_status, suspended, minutes_used_this_week, created_at, owner_uid, reseller_markup")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("reseller_id", user.id);
  }

  const { data: clients, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(clients || []);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await request.json();
  const { businessId, resellerId, resellerMarkup } = body;

  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (resellerId !== undefined) updates.reseller_id = resellerId || null;
  if (resellerMarkup !== undefined) updates.reseller_markup = resellerMarkup;

  const { error } = await supabaseAdmin
    .from("businesses")
    .update(updates)
    .eq("id", businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}






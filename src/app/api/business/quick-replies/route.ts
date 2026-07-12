import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const businessId = url.searchParams.get("businessId") || "";

  const { data } = await supabase
    .from("business_quick_replies")
    .select("*")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("sort_order");

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, text } = await request.json();
  if (!businessId || !text) return NextResponse.json({ error: "Missing businessId or text" }, { status: 400 });

  // Get the max sort_order
  const { data: existing } = await supabase
    .from("business_quick_replies")
    .select("sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = (existing && existing[0]?.sort_order != null) ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("business_quick_replies")
    .insert({ business_id: businessId, text, sort_order: nextSort })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, text, sort_order, active } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (text !== undefined) updates.text = text;
  if (sort_order !== undefined) updates.sort_order = sort_order;
  if (active !== undefined) updates.active = active;

  const { error } = await supabase.from("business_quick_replies").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("business_quick_replies").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

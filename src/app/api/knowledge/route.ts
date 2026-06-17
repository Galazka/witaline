import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET: List knowledge entries for a business
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const category = searchParams.get("category");

  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  const supabase = getSupabase();

  let query = supabase
    .from("business_knowledge")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (category) query = query.eq("category", category);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ knowledge: data });
}

// POST: Create knowledge entry
export async function POST(request: Request) {
  const { businessId, category, title, content, metadata } = await request.json();

  if (!businessId || !title || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("business_knowledge")
    .insert({
      business_id: businessId,
      category: category || "general",
      title,
      content,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ knowledge: data }, { status: 201 });
}

// PATCH: Update knowledge entry
export async function PATCH(request: Request) {
  const { id, businessId, title, content, category, active, sort_order } = await request.json();

  if (!id || !businessId) {
    return NextResponse.json({ error: "Missing id or businessId" }, { status: 400 });
  }

  const supabase = getSupabase();
  const updates: Record<string, unknown> = {};

  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (category !== undefined) updates.category = category;
  if (active !== undefined) updates.active = active;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from("business_knowledge")
    .update(updates)
    .eq("id", id)
    .eq("business_id", businessId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ knowledge: data });
}

// DELETE: Remove knowledge entry
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const businessId = searchParams.get("businessId");

  if (!id || !businessId) {
    return NextResponse.json({ error: "Missing id or businessId" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { error } = await supabase
    .from("business_knowledge")
    .delete()
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

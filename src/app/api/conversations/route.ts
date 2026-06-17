import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET: List conversations for a business
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const channel = searchParams.get("channel");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  const supabase = getSupabase();

  let query = supabase
    .from("conversations")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (channel) query = query.eq("channel", channel);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get total count
  const { count } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  return NextResponse.json({ conversations: data, total: count || 0 });
}

// PATCH: Update conversation (summary, tags, status)
export async function PATCH(request: Request) {
  const { conversationId, businessId, summary, tags, status, sentiment } = await request.json();

  if (!conversationId || !businessId) {
    return NextResponse.json({ error: "Missing conversationId or businessId" }, { status: 400 });
  }

  const supabase = getSupabase();
  const updates: Record<string, unknown> = {};

  if (summary !== undefined) updates.summary = summary;
  if (tags !== undefined) updates.tags = tags;
  if (status !== undefined) updates.status = status;
  if (sentiment !== undefined) updates.sentiment = sentiment;

  const { data, error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", conversationId)
    .eq("business_id", businessId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: data });
}

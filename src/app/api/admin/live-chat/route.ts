import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "active";
  const search = url.searchParams.get("search") || "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = supabaseAdmin
    .from("conversations")
    .select("*, businesses:business_id(name, phone)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (status === "waiting") {
    query = query.cs("tags", ["oczekuje_na_konsultanta"]);
  } else if (status === "active") {
    // active or tagged with oczekuje_na_konsultanta
    query = query.or(`status.eq.active,tags.cs.{oczekuje_na_konsultanta}`);
  } else if (status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`caller_name.ilike.%${search}%,caller_id.ilike.%${search}%,summary.ilike.%${search}%`);
  }

  const { data: conversations, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ conversations: conversations || [] });
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const statusFilter = url.searchParams.get("status");

  let query = supabaseAdmin
    .from("webhook_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter === "success") {
    query = query.eq("success", true);
  } else if (statusFilter === "error") {
    query = query.eq("success", false);
  }

  const { data: logs, count: total, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs, total });
}

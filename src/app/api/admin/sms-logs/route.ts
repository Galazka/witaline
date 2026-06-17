import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "all";
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabaseAdmin
    .from("sms_logs")
    .select("*, businesses!inner(name)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (view === "failed") {
    query = query.eq("status", "failed");
  } else if (view === "sent") {
    query = query.not("status", "eq", "failed");
  }

  const { data: logs, error: logsError, count } = await query;

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 });
  }

  const { count: total } = await supabaseAdmin
    .from("sms_logs")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({
    logs: logs || [],
    total: total || 0,
    limit,
    offset,
  });
}

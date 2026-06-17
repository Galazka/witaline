import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  let query = supabaseAdmin
    .from("call_logs")
    .select("id, caller_id, from_number, duration_seconds, cost_pln, classification, ai_summary, transcript, recording_url, was_helpful, created_at, ended_at")
    .eq("business_id", auth.businessId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (fromDate) query = query.gte("created_at", fromDate);
  if (toDate) query = query.lte("created_at", toDate + "T23:59:59");

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    meta: { limit, offset, returned: data?.length || 0 },
  });
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");
  const status = searchParams.get("status");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  let query = supabaseAdmin
    .from("reservations")
    .select("id, caller_name, caller_phone, service_type, reserved_at, duration_minutes, notes, status, created_at")
    .eq("business_id", auth.businessId)
    .order("reserved_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (fromDate) query = query.gte("reserved_at", fromDate);
  if (toDate) query = query.lte("reserved_at", toDate + "T23:59:59");

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    meta: { limit, offset, returned: data?.length || 0 },
  });
}

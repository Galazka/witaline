import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const { error: authErr } = await checkAdminAuth();
  if (authErr) return authErr;
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");

  let query = supabaseAdmin
    .from("call_logs")
    .select("to_number, business_id, routed_business_name, duration_seconds, cost_pln, classification, has_human_handoff, handoff_status, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (businessId) query = query.eq("business_id", businessId);

  const { data: calls, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!calls) return NextResponse.json({ groups: [], total: 0 });

  // Group by phone number
  const groups = new Map<string, {
    phoneNumber: string;
    businessName: string;
    totalCalls: number;
    totalDuration: number;
    totalCost: number;
    handoffAttempts: number;
    handoffSuccess: number;
    lastCall: string;
  }>();

  for (const call of calls) {
    const key = call.to_number || "unknown";
    const existing = groups.get(key) || {
      phoneNumber: key,
      businessName: call.routed_business_name || "—",
      totalCalls: 0,
      totalDuration: 0,
      totalCost: 0,
      handoffAttempts: 0,
      handoffSuccess: 0,
      lastCall: call.created_at,
    };

    existing.totalCalls++;
    existing.totalDuration += call.duration_seconds || 0;
    existing.totalCost += call.cost_pln || 0;
    if (call.has_human_handoff) existing.handoffAttempts++;
    if (call.handoff_status === "completed") existing.handoffSuccess++;
    if (call.created_at > existing.lastCall) existing.lastCall = call.created_at;
    existing.businessName = call.routed_business_name || existing.businessName;

    groups.set(key, existing);
  }

  const result = Array.from(groups.values()).sort((a, b) => b.totalCalls - a.totalCalls);
  return NextResponse.json({ groups: result, total: calls.length });
}
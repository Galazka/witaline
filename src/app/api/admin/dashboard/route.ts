import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "all";

  const now = new Date();
  let since: string | null = null;
  if (range === "today") since = now.toISOString().slice(0, 10);
  else if (range === "7d") since = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  else if (range === "30d") since = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

  const { data: businesses } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .neq("id", "00000000-0000-0000-0000-000000000001")
    .order("created_at", { ascending: false });

  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  let callsQuery = supabaseAdmin
    .from("call_logs")
    .select("id, cost_pln, created_at")
    .is("deleted_at", null);
  if (since) callsQuery = callsQuery.gte("created_at", since);
  const { data: callLogs } = await callsQuery;

  const totalCalls = callLogs?.length || 0;
  const totalCost = callLogs?.reduce((a, c) => a + Number(c.cost_pln), 0) || 0;
  const todayCalls = callLogs?.filter((l) =>
    l.created_at?.startsWith(new Date().toISOString().slice(0, 10))
  ).length || 0;

  return NextResponse.json({
    businesses: businesses || [],
    leads: leads || [],
    stats: {
      totalBusinesses: businesses?.length || 0,
      totalLeads: leads?.length || 0,
      totalCalls,
      totalCost: totalCost.toFixed(2),
      todayCalls,
      activeSubscriptions: businesses?.filter(
        (b) => b.subscription_status === "active" || b.subscription_status === "trialing"
      ).length || 0,
      suspendedCount: businesses?.filter((b) => b.suspended).length || 0,
    },
  });
}






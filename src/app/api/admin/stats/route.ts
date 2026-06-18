import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "7";
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const businessId = searchParams.get("businessId"); // optional filter

  // Date filter logic
  let dateFilter: string | null = null;
  if (fromDate && toDate) {
    dateFilter = fromDate;
  } else if (range === "30") {
    const d = new Date(); d.setDate(d.getDate() - 30);
    dateFilter = d.toISOString().slice(0, 10);
  } else if (range === "90") {
    const d = new Date(); d.setDate(d.getDate() - 90);
    dateFilter = d.toISOString().slice(0, 10);
  } else if (range === "all") {
    dateFilter = null;
  } else {
    const d = new Date(); d.setDate(d.getDate() - 7);
    dateFilter = d.toISOString().slice(0, 10);
  }

  // ── Fetch all businesses (for selector & per-biz breakdown) ──
  const { data: businesses } = await supabaseAdmin
    .from("businesses")
    .select("id, name")
    .order("name");

  // ── Call logs query ──
  let logsQuery = supabaseAdmin
    .from("call_logs")
    .select("id, business_id, duration_seconds, cost_pln, classification, ai_summary, created_at, from_number, started_at, transcript, ai_summary")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20000);

  if (dateFilter) logsQuery = logsQuery.gte("created_at", dateFilter);
  if (fromDate && toDate) {
    logsQuery = logsQuery.gte("created_at", fromDate).lte("created_at", toDate + "T23:59:59");
  }
  if (businessId && businessId !== "all") {
    logsQuery = logsQuery.eq("business_id", businessId);
  }

  const { data: logs, error: logsError } = await logsQuery;
  if (logsError) console.error("[AdminStats] call_logs error:", logsError.message);

  // ── Conversations query (with channel source) ──
  let convsQuery = supabaseAdmin
    .from("conversations")
    .select("id, business_id, created_at, channel")
    .order("created_at", { ascending: false })
    .limit(20000);

  if (dateFilter) convsQuery = convsQuery.gte("created_at", dateFilter);
  if (fromDate && toDate) {
    convsQuery = convsQuery.gte("created_at", fromDate).lte("created_at", toDate + "T23:59:59");
  }
  if (businessId && businessId !== "all") {
    convsQuery = convsQuery.eq("business_id", businessId);
  }

  const { data: conversations, error: convsError } = await convsQuery;
  if (convsError) console.error("[AdminStats] conversations error:", convsError.message);

  // ── Aggregate totals ──
  const totalCalls = logs?.length || 0;
  const totalConversations = conversations?.length || 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayCalls = logs?.filter(l => l.created_at?.startsWith(today)).length || 0;

  const orders = logs?.filter(l => l.classification === "order").length || 0;
  const inquiries = logs?.filter(l => l.classification === "inquiry" || l.classification === "question").length || 0;
  const spam = logs?.filter(l => l.classification === "spam").length || 0;
  const bookings = logs?.filter(l => l.classification === "booking").length || 0;

  const avgDuration = totalCalls > 0
    ? (logs!.reduce((a, l) => a + (l.duration_seconds || 0), 0) / totalCalls)
    : 0;

  const totalMinutes = (logs?.reduce((a, l) => a + (l.duration_seconds || 0), 0) || 0) / 60;
  const totalCost = logs?.reduce((a, l) => a + Number(l.cost_pln || 0), 0) || 0;

  // ── Per-business breakdown ──
  const bizBreakdown = (businesses || []).map(biz => {
    const bizLogs = (logs || []).filter(l => l.business_id === biz.id);
    const bizConvs = (conversations || []).filter(c => c.business_id === biz.id);
    return {
      id: biz.id,
      name: biz.name,
      calls: bizLogs.length,
      conversations: bizConvs.length,
      minutes: Math.round((bizLogs.reduce((a, l) => a + (l.duration_seconds || 0), 0)) / 60),
      cost: bizLogs.reduce((a, l) => a + Number(l.cost_pln || 0), 0).toFixed(2),
      orders: bizLogs.filter(l => l.classification === "order").length,
    };
  }).sort((a, b) => b.calls - a.calls);

  // ── Source breakdown (conversation channel) ──
  const sourceBreakdown = {
    web: (conversations || []).filter(c => c.channel === "web").length,
    voice: (conversations || []).filter(c => c.channel === "voice").length,
    widget: (conversations || []).filter(c => c.channel === "widget").length,
    sms: (conversations || []).filter(c => c.channel === "sms").length,
    phone: totalCalls, // call_logs = phone calls
  };

  // ── Hourly breakdown (24h) ──
  const hours24 = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, "0");
    const count = logs?.filter(l => l.created_at?.slice(11, 13) === h).length || 0;
    return { hour: `${h}:00`, count };
  });

  // ── Daily data ──
  const daysToGenerate = fromDate && toDate
    ? Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000) + 1
    : range === "all" ? 30 : parseInt(range);

  const dailyData: { date: string; calls: number; convos: number }[] = [];
  for (let i = daysToGenerate - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    dailyData.push({
      date: ds,
      calls: logs?.filter(l => l.created_at?.startsWith(ds)).length || 0,
      convos: conversations?.filter(c => c.created_at?.startsWith(ds)).length || 0,
    });
  }

  // ── Top callers ──
  const topCallers = Object.entries(
    ((logs || []) as any[]).reduce<Record<string, number>>((acc, l) => {
      const num = l.from_number || "unknown";
      acc[num] = (acc[num] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 15);

  // ── Detailed call logs for table ──
  const bizMap = new Map((businesses || []).map(b => [b.id, b.name]));
  const callLogs = (logs || []).map(l => ({
    id: l.id,
    business_id: l.business_id,
    business_name: bizMap.get(l.business_id || "") || "—",
    date: l.created_at,
    from_number: l.from_number || "—",
    duration_seconds: l.duration_seconds || 0,
    cost_pln: Number(l.cost_pln || 0),
    classification: l.classification || "unknown",
    summary: l.ai_summary || (l.transcript || "").slice(0, 100),
  }));

  return NextResponse.json({
    // Overview
    totalCalls,
    totalConversations,
    todayCalls,
    orders,
    inquiries,
    spam,
    bookings,
    avgDuration: Math.round(avgDuration),
    totalMinutes: Math.round(totalMinutes),
    totalCost: totalCost.toFixed(2),

    // Breakdowns
    hours24,
    dailyData,
    topCallers,
    sourceBreakdown,
    bizBreakdown,

    // Detailed logs
    callLogs,

    // Meta
    businesses: businesses || [],
    range: fromDate && toDate ? `${fromDate} - ${toDate}` : range,
  });
}

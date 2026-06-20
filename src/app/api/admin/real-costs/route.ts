import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

const WITALINE_MAIN_ID = "00000000-0000-0000-0000-000000000001";

const PLAN_REVENUE: Record<string, number> = {
  start_100: 299,
  pro_500: 600,
  enterprise_2000: 1500,
  elastic_0: 0,
  pro_249: 300,
  lux_599: 800,
};

import { INTERNAL_COST_PER_MIN } from "@/lib/pricing";

const USD_TO_PLN = 4.0;
const COST_ELEVENLABS_PER_MIN = 0.09 * USD_TO_PLN;
const COST_TWILIO_PER_MIN = 0.013 * USD_TO_PLN;
const COST_OPENROUTER_PER_MIN = 0.0003 * USD_TO_PLN;
const COST_SMS_PER_UNIT = 0.0779 * USD_TO_PLN;

export async function GET(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const includePrev = searchParams.get("includePrev") === "true";

  const now = new Date();
  const from = fromParam
    ? new Date(fromParam)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toParam ? new Date(toParam) : now;

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  // Previous period same length
  const prevPeriodLen = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - prevPeriodLen);
  const prevFromStr = prevFrom.toISOString().slice(0, 10);
  const prevToStr = prevTo.toISOString().slice(0, 10);

  // 1. All businesses
  const { data: businesses } = await supabaseAdmin
    .from("businesses")
    .select("id, name, current_plan, subscription_status, custom_monthly_revenue");

  // 2. Call logs in period
  let callsQuery = supabaseAdmin
    .from("call_logs")
    .select("id, business_id, duration_seconds, cost_pln, internal_cost_pln, cost_elevenlabs, cost_twilio, cost_openrouter, total_cost, revenue_pln, from_number, caller_id, twilio_call_sid, classification, created_at")
    .is("deleted_at", null)
    .gte("created_at", fromStr)
    .lte("created_at", toStr + "T23:59:59");
  if (businessId) callsQuery = callsQuery.eq("business_id", businessId);
  const { data: callLogs } = await callsQuery;

  // 3. Previous period call logs (for comparison)
  let prevCallLogs: typeof callLogs = [];
  if (includePrev) {
    let pq = supabaseAdmin
      .from("call_logs")
      .select("id, business_id, duration_seconds, cost_pln, internal_cost_pln, cost_elevenlabs, cost_twilio, cost_openrouter, from_number, caller_id, twilio_call_sid, created_at")
      .gte("created_at", prevFromStr)
      .lte("created_at", prevToStr + "T23:59:59");
    if (businessId) pq = pq.eq("business_id", businessId);
    const { data } = await pq;
    prevCallLogs = data;
  }

  // 4. SMS logs
  let smsQuery = supabaseAdmin
    .from("sms_logs")
    .select("business_id, id")
    .gte("created_at", fromStr)
    .lte("created_at", toStr + "T23:59:59");
  if (businessId) smsQuery = smsQuery.eq("business_id", businessId);
  const { data: smsLogs } = await smsQuery;

  // 5. Cost items (own costs)
  const { data: costItems } = await supabaseAdmin
    .from("cost_items")
    .select("*")
    .order("due_date", { ascending: true });

  // Build maps
  const bizMap = new Map<string, { name: string; plan: string; status: string; customRevenue: number | null }>();
  for (const b of businesses || []) {
    bizMap.set(b.id, { name: b.name, plan: b.current_plan || "start_100", status: b.subscription_status || "", customRevenue: (b as any).custom_monthly_revenue ?? null });
  }

function buildCallMap(logs: typeof callLogs) {
    const map = new Map<string, { calls: number; minutes: number; costPln: number; costElevenlabs: number; costTwilio: number; costOpenrouter: number }>();
    for (const log of logs || []) {
      const bid = log.business_id || "unknown";
      if (!map.has(bid)) map.set(bid, { calls: 0, minutes: 0, costPln: 0, costElevenlabs: 0, costTwilio: 0, costOpenrouter: 0 });
      const entry = map.get(bid)!;
      entry.calls += 1;
      entry.costPln += Number(log.internal_cost_pln ?? log.cost_pln) || 0;
      const minutes = (log.duration_seconds || 0) / 60;
      const rawEleven = Number(log.cost_elevenlabs);
      entry.costElevenlabs += rawEleven > 0 ? rawEleven * USD_TO_PLN : minutes * COST_ELEVENLABS_PER_MIN;
      if (log.twilio_call_sid) {
        const rawTwilio = Number(log.cost_twilio);
        entry.costTwilio += rawTwilio > 0 ? rawTwilio * USD_TO_PLN : minutes * COST_TWILIO_PER_MIN;
      }
      const rawOpenrouter = Number(log.cost_openrouter);
      entry.costOpenrouter += rawOpenrouter > 0 ? rawOpenrouter * USD_TO_PLN : minutes * COST_OPENROUTER_PER_MIN;
    }
    return map;
  }

  const callMap = buildCallMap(callLogs);
  const prevCallMap = buildCallMap(prevCallLogs);

  const smsCountMap = new Map<string, number>();
  for (const log of smsLogs || []) {
    const bid = log.business_id || "unknown";
    smsCountMap.set(bid, (smsCountMap.get(bid) || 0) + 1);
  }

  // Include ALL businesses + any that have calls
  const allBizIds = new Set<string>();
  for (const b of businesses || []) allBizIds.add(b.id);
  for (const bid of [...callMap.keys(), ...smsCountMap.keys()]) allBizIds.add(bid);
  if (businessId) allBizIds.add(businessId);

  const daysInRange = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);

  const result: Array<Record<string, unknown>> = [];

  for (const bid of allBizIds) {
    if (bid === "unknown") continue;
    const bizInfo = bizMap.get(bid) || { name: "Nieznana", plan: "start_100", status: "", customRevenue: null };
    const callData = callMap.get(bid) || { calls: 0, minutes: 0, costPln: 0, costElevenlabs: 0, costTwilio: 0, costOpenrouter: 0 };
    const prevCallData = prevCallMap.get(bid) || { calls: 0, minutes: 0, costPln: 0, costElevenlabs: 0, costTwilio: 0, costOpenrouter: 0 };
    const smsCount = smsCountMap.get(bid) || 0;
    const costSms = smsCount * COST_SMS_PER_UNIT;
    const costFromLogs = callData.costPln;
    const totalCost = costFromLogs > 0 ? costFromLogs : Math.round((callData.costElevenlabs + callData.costTwilio + callData.costOpenrouter + costSms) * 100) / 100;
    const prevCostFromLogs = prevCallData.costPln;
    const prevTotalCost = prevCostFromLogs > 0 ? prevCostFromLogs : Math.round((prevCallData.costElevenlabs + prevCallData.costTwilio + prevCallData.costOpenrouter) * 100) / 100;

    const isWitaLine = bid === WITALINE_MAIN_ID;
    const monthlyRevenue = isWitaLine ? 0 : (bizInfo.customRevenue ?? (PLAN_REVENUE[bizInfo.plan] ?? 0));
    const revenue = Math.round((monthlyRevenue / 30) * daysInRange * 100) / 100;

    const prevRev = includePrev ? (isWitaLine ? 0 : Math.round((monthlyRevenue / 30) * Math.max(1, Math.round(prevPeriodLen / 86400000)) * 100) / 100) : 0;

    result.push({
      id: bid,
      name: bizInfo.name,
      plan: bizInfo.plan,
      is_centrala: isWitaLine,
      calls: callData.calls,
      minutes: Math.round(callData.minutes * 100) / 100,
      costElevenlabs: Math.round(callData.costElevenlabs * 100) / 100,
      costTwilio: Math.round(callData.costTwilio * 100) / 100,
      costOpenrouter: Math.round(callData.costOpenrouter * 100) / 100,
      costSms: Math.round(costSms * 100) / 100,
      totalCost,
      revenue: Math.round(revenue * 100) / 100,
      customRevenue: bizInfo.customRevenue,
      prevTotalCost: includePrev ? prevTotalCost : null,
      prevRevenue: includePrev ? Math.round(prevRev * 100) / 100 : null,
      prevCalls: includePrev ? prevCallData.calls : null,
    });
  }

  result.sort((a, b) => (a.name as string).localeCompare(b.name as string));

  // Calculate own costs (monthly equivalent)
  const ownCostsSummary = buildOwnCostsSummary(costItems || []);

  // Build call log details for the period (exclude prev period)
  const callLogDetails = (callLogs || []).map((log) => ({
    id: log.id,
    business_id: log.business_id,
    duration_seconds: log.duration_seconds,
    cost_pln: Number(log.cost_pln) || 0,
    internal_cost_pln: Number(log.internal_cost_pln ?? log.cost_pln) || 0,
    cost_elevenlabs: Number(log.cost_elevenlabs) || 0,
    cost_twilio: Number(log.cost_twilio) || 0,
    cost_openrouter: Number(log.cost_openrouter) || 0,
    total_cost: Number(log.total_cost) || Number(log.cost_pln) || 0,
    revenue_pln: Number(log.revenue_pln) || 0,
    from_number: log.from_number || log.caller_id || "",
    classification: log.classification || "unknown",
    created_at: log.created_at,
    business_name: bizMap.get(log.business_id || "")?.name || "Nieznana",
  }));

  return NextResponse.json({
    businesses: result,
    own_costs: ownCostsSummary,
    cost_items: costItems || [],
    call_logs: callLogDetails,
  });
}

interface CostItem {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  due_date: string | null;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
}

function buildOwnCostsSummary(items: CostItem[]) {
  const monthlyTotal = items.reduce((sum, item) => {
    switch (item.frequency) {
      case "monthly": return sum + item.amount;
      case "quarterly": return sum + item.amount / 3;
      case "yearly": return sum + item.amount / 12;
      default: return sum;
    }
  }, 0);

  const unpaid = items.filter((i) => !i.is_paid);
  const unpaidTotal = unpaid.reduce((s, i) => s + i.amount, 0);

  const byCategory = new Map<string, { count: number; total: number; monthly: number }>();
  for (const item of items) {
    const cat = item.category || "other";
    if (!byCategory.has(cat)) byCategory.set(cat, { count: 0, total: 0, monthly: 0 });
    const entry = byCategory.get(cat)!;
    entry.count += 1;
    entry.total += item.amount;
    const freqMultiplier = item.frequency === "monthly" ? 1 : item.frequency === "quarterly" ? 1/3 : item.frequency === "yearly" ? 1/12 : 0;
    entry.monthly += item.amount * freqMultiplier;
  }

  return {
    monthly_total: Math.round(monthlyTotal * 100) / 100,
    unpaid_total: Math.round(unpaidTotal * 100) / 100,
    unpaid_count: unpaid.length,
    total_items: items.length,
    by_category: Object.fromEntries(byCategory),
  };
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

import { getPlanConfig } from "@/lib/pricing";
function getPlanRevenue(planKey: string): number {
  if (planKey === "elastic_0" || planKey === "self_service") return 0;
  const cfg = getPlanConfig(planKey);
  return cfg?.price ?? 199;
}

import { INTERNAL_COST_PER_MIN } from "@/lib/pricing";
import {
  USD_TO_PLN,
  ELEVENLABS_COST_PER_MIN_USD,
  TWILIO_AVG_COST_PER_MIN_USD,
  OPENROUTER_COST_PER_MIN_USD,
  TWILIO_SMS_COST_PER_SEGMENT_PLN,
  TWILIO_POLAND_MOBILE_COST_PER_MIN_USD,
} from "@/lib/cost-rates";

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
    .select("id, business_id, duration_seconds, cost_pln, cost_elevenlabs, cost_twilio, cost_openrouter, total_cost, revenue_pln, from_number, caller_id, twilio_call_sid, classification, created_at")
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
      .select("id, business_id, duration_seconds, cost_pln, cost_elevenlabs, cost_twilio, cost_openrouter, from_number, caller_id, twilio_call_sid, created_at")
      .is("deleted_at", null)
      .gte("created_at", prevFromStr)
      .lte("created_at", prevToStr + "T23:59:59");
    if (businessId) pq = pq.eq("business_id", businessId);
    const { data } = await pq;
    prevCallLogs = data;
  }

  // 4. SMS logs
  let smsQuery = supabaseAdmin
    .from("sms_logs")
    .select("business_id, id, created_at")
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
    const map = new Map<string, { calls: number; minutes: number; costPln: number; costElevenlabs: number; costTwilio: number; costOpenrouter: number; consultantTransferCost: number }>();
    for (const log of logs || []) {
      const bid = log.business_id || "unknown";
      if (!map.has(bid)) map.set(bid, { calls: 0, minutes: 0, costPln: 0, costElevenlabs: 0, costTwilio: 0, costOpenrouter: 0, consultantTransferCost: 0 });
      const entry = map.get(bid)!;
      const minutes = (log.duration_seconds || 0) / 60;
      entry.calls += 1;
      entry.costPln += Number(log.total_cost ?? log.cost_pln) || 0;

      // ElevenLabs — synced in USD from sync-costs
      // Only use actual synced data, never inflate with fallback estimates
      const rawEleven = Number(log.cost_elevenlabs);
      entry.costElevenlabs += rawEleven > 0 ? rawEleven : 0;

      // Twilio — synced in USD from sync-costs
      // Only use actual synced data, never inflate with fallback estimates
      const rawTwilio = Number(log.cost_twilio);
      entry.costTwilio += Math.abs(rawTwilio) > 0 ? Math.abs(rawTwilio) : 0;

      // OpenRouter — negligible, estimated at $0.0003/min
      entry.costOpenrouter += minutes * OPENROUTER_COST_PER_MIN_USD;

      // Consultant transfer — Twilio outbound leg (if call was transferred)
      if ((log as any).routed_to_extension && minutes > 0) {
        entry.consultantTransferCost += minutes * TWILIO_POLAND_MOBILE_COST_PER_MIN_USD;
      }
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

  // Include ALL businesses + any that have calls/sms/wa
  const allBizIds = new Set<string>();
  for (const b of businesses || []) allBizIds.add(b.id);
  for (const bid of [...callMap.keys(), ...smsCountMap.keys()]) allBizIds.add(bid);
  if (businessId) allBizIds.add(businessId);

  const daysInRange = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);

  const result: Array<Record<string, unknown>> = [];

  for (const bid of allBizIds) {
    if (bid === "unknown") continue;
    const bizInfo = bizMap.get(bid) || { name: "Nieznana", plan: "start_100", status: "", customRevenue: null };
    const callData = callMap.get(bid) || { calls: 0, minutes: 0, costPln: 0, costElevenlabs: 0, costTwilio: 0, costOpenrouter: 0, consultantTransferCost: 0 };
    const prevCallData = prevCallMap.get(bid) || { calls: 0, minutes: 0, costPln: 0, costElevenlabs: 0, costTwilio: 0, costOpenrouter: 0, consultantTransferCost: 0 };
    const smsCount = smsCountMap.get(bid) || 0;
    const costSms = smsCount * TWILIO_SMS_COST_PER_SEGMENT_PLN;
    const costConsultant = callData.consultantTransferCost || 0;
    // Always calculate total from individual components (actual synced data)
    // Never use pre-calculated costPln which may contain inflated fallback estimates
    const totalCost = Math.round((callData.costElevenlabs + callData.costTwilio + callData.costOpenrouter + costSms + costConsultant) * 100) / 100;
    const prevTotalCost = Math.round((prevCallData.costElevenlabs + prevCallData.costTwilio + prevCallData.costOpenrouter) * 100) / 100;

    const isWitaLine = bid === WITALINE_MAIN_BUSINESS_ID;
    const monthlyRevenue = isWitaLine ? 0 : (bizInfo.customRevenue ?? getPlanRevenue(bizInfo.plan));
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
      costConsultant: Math.round(costConsultant * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
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
  const callLogDetails = (callLogs || []).map((log) => {
    const bizId = log.business_id || "";
    const planInfo = bizMap.get(bizId) || { name: "Nieznana", plan: "start", status: "", customRevenue: null };
    const monthlyRevenue = bizId === WITALINE_MAIN_BUSINESS_ID ? 0 : (planInfo.customRevenue ?? getPlanRevenue(planInfo.plan));
    const daysInRange = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
    const dailyRevenue = monthlyRevenue > 0 ? monthlyRevenue / 30 : 0;
    return {
      id: log.id,
      business_id: bizId,
      duration_seconds: log.duration_seconds,
      cost_pln: Number(log.cost_pln) || 0,
      internal_cost_pln: Number(log.total_cost ?? log.cost_pln) || 0,
      cost_elevenlabs: Number(log.cost_elevenlabs) || 0,
      cost_twilio: Number(log.cost_twilio) || 0,
      cost_openrouter: Number(log.cost_openrouter) || 0,
      // Always calculate total_cost from components (not from DB field which may be stale)
      total_cost: Math.round(((Number(log.cost_elevenlabs) || 0) + (Number(log.cost_twilio) || 0) + (Number(log.cost_openrouter) || 0)) * 100) / 100,
      revenue_pln: Number(log.revenue_pln) || 0,
      plan_revenue_pln: Math.round(dailyRevenue * 100) / 100,
      from_number: log.from_number || log.caller_id || "",
      classification: log.classification || "unknown",
      created_at: log.created_at,
      business_name: planInfo.name,
    };
  });

  const smsTotal = smsLogs?.length || 0;

  // Total call_logs count (unfiltered by date) for diagnostics
  const { count: totalCallLogs } = await supabaseAdmin
    .from("call_logs")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  return NextResponse.json({
    businesses: result,
    own_costs: ownCostsSummary,
    cost_items: costItems || [],
    call_logs: callLogDetails,
    sms_total: smsTotal,
    cost_sms_total: Math.round(smsTotal * TWILIO_SMS_COST_PER_SEGMENT_PLN * 100) / 100,
    total_call_logs: totalCallLogs ?? 0,
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

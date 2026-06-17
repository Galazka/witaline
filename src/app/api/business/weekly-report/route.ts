import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getWeekRange(date: Date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const mondayDiff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayDiff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday.toISOString(), end: sunday.toISOString() };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  const now = new Date();
  const currentWeek = getWeekRange(now);

  const prevWeekStart = new Date(currentWeek.start);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(currentWeek.start);
  prevWeekEnd.setMilliseconds(-1);
  const previousWeek = { start: prevWeekStart.toISOString(), end: prevWeekEnd.toISOString() };

  const [currentCalls, currentLeads, currentReservations, currentSms] = await Promise.all([
    supabaseAdmin.from("call_logs").select("*").eq("business_id", businessId).gte("created_at", currentWeek.start).lte("created_at", currentWeek.end),
    supabaseAdmin.from("leads").select("*").eq("business_id", businessId).gte("created_at", currentWeek.start).lte("created_at", currentWeek.end),
    supabaseAdmin.from("reservations").select("*").eq("business_id", businessId).gte("created_at", currentWeek.start).lte("created_at", currentWeek.end),
    supabaseAdmin.from("sms_logs").select("*").eq("business_id", businessId).gte("created_at", currentWeek.start).lte("created_at", currentWeek.end),
  ]);

  const [prevCalls, prevLeads, prevReservations, prevSms] = await Promise.all([
    supabaseAdmin.from("call_logs").select("*").eq("business_id", businessId).gte("created_at", previousWeek.start).lte("created_at", previousWeek.end),
    supabaseAdmin.from("leads").select("*").eq("business_id", businessId).gte("created_at", previousWeek.start).lte("created_at", previousWeek.end),
    supabaseAdmin.from("reservations").select("*").eq("business_id", businessId).gte("created_at", previousWeek.start).lte("created_at", previousWeek.end),
    supabaseAdmin.from("sms_logs").select("*").eq("business_id", businessId).gte("created_at", previousWeek.start).lte("created_at", previousWeek.end),
  ]);

  const calls = currentCalls.data || [];
  const leads = currentLeads.data || [];
  const reservations = currentReservations.data || [];
  const sms = currentSms.data || [];

  const prevCallsData = prevCalls.data || [];
  const prevLeadsData = prevLeads.data || [];
  const prevReservationsData = prevReservations.data || [];
  const prevSmsData = prevSms.data || [];

  const total_calls = calls.length;
  const total_minutes = Math.round(calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60);
  const total_leads = leads.length;
  const total_bookings = reservations.filter((r) => r.status !== "cancelled").length;
  const total_sms = sms.length;

  const classification_breakdown: Record<string, number> = {};
  calls.forEach((c) => {
    const key = c.classification || "unknown";
    classification_breakdown[key] = (classification_breakdown[key] || 0) + 1;
  });

  const daily_breakdown: Record<string, { calls: number; leads: number }> = {};
  const dayNames = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

  const monday = new Date(currentWeek.start);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    daily_breakdown[dateStr] = { calls: 0, leads: 0 };
  }

  calls.forEach((c) => {
    const dateStr = c.created_at?.slice(0, 10);
    if (dateStr && daily_breakdown[dateStr]) {
      daily_breakdown[dateStr].calls += 1;
    }
  });

  leads.forEach((l) => {
    const dateStr = l.created_at?.slice(0, 10);
    if (dateStr && daily_breakdown[dateStr]) {
      daily_breakdown[dateStr].leads += 1;
    }
  });

  const hourCounts: Record<number, number> = {};
  calls.forEach((c) => {
    if (c.created_at) {
      const hour = new Date(c.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const dayCounts: Record<number, number> = {};
  calls.forEach((c) => {
    if (c.created_at) {
      const day = new Date(c.created_at).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  });

  let peak_day: string | null = null;
  let peakDayMax = 0;
  Object.entries(dayCounts).forEach(([dayNum, count]) => {
    if (count > peakDayMax) {
      peakDayMax = count;
      peak_day = dayNames[Number(dayNum)];
    }
  });

  let peak_hour: string | null = null;
  let peakHourMax = 0;
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > peakHourMax) {
      peakHourMax = count;
      peak_hour = `${hour}:00`;
    }
  });

  const prev_total_calls = prevCallsData.length;
  const prev_total_leads = prevLeadsData.length;
  const prev_total_bookings = prevReservationsData.filter((r) => r.status !== "cancelled").length;
  const prev_total_sms = prevSmsData.length;

  return NextResponse.json({
    weekStart: currentWeek.start,
    weekEnd: currentWeek.end,
    total_calls,
    total_minutes,
    total_leads,
    total_bookings,
    total_sms,
    classification_breakdown,
    daily_breakdown,
    peak_day,
    peak_hour,
    previous_week: {
      total_calls: prev_total_calls,
      total_leads: prev_total_leads,
      total_bookings: prev_total_bookings,
      total_sms: prev_total_sms,
    },
  });
}

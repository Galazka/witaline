import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  // Próba z subscription_current_period_end (może nie istnieć w DB)
  let businesses: any[] | null = null;
  try {
    const result = await supabaseAdmin
      .from("businesses")
      .select("id, name, owner_uid, twilio_number, current_plan, minutes_used_this_week, subscription_status, suspended, industry, website_url, phone, whatsapp_number, created_at, voice_id, trial_ends_at, subscription_current_period_end")
      .neq("id", WITALINE_MAIN_BUSINESS_ID)
      .order("created_at", { ascending: false });
    businesses = result.data;
  } catch {
    const result = await supabaseAdmin
      .from("businesses")
      .select("id, name, owner_uid, twilio_number, current_plan, minutes_used_this_week, subscription_status, suspended, industry, website_url, phone, whatsapp_number, created_at, voice_id, trial_ends_at")
      .neq("id", WITALINE_MAIN_BUSINESS_ID)
      .order("created_at", { ascending: false });
    businesses = result.data;
  }

  if (!businesses) return NextResponse.json([]);

  const result = await Promise.all(
    businesses.map(async (b) => {
      const { count: totalCalls } = await supabaseAdmin
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("business_id", b.id);

      const { count: orders } = await supabaseAdmin
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("business_id", b.id)
        .eq("classification", "order");

      const { count: spamCalls } = await supabaseAdmin
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("business_id", b.id)
        .eq("classification", "spam");

      const { count: bookings } = await supabaseAdmin
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("business_id", b.id)
        .eq("classification", "booking");

      const { count: smsCount } = await supabaseAdmin
        .from("sms_logs")
        .select("*", { count: "exact", head: true })
        .eq("business_id", b.id);

      const { data: callLogs } = await supabaseAdmin
        .from("call_logs")
        .select("duration_seconds, cost_pln, created_at, classification")
        .is("deleted_at", null)
        .eq("business_id", b.id);

      const totalMinutes = (callLogs || []).reduce((a, l) => a + (l.duration_seconds || 0), 0) / 60;
      const totalCost = (callLogs || []).reduce((a, l) => a + Number(l.cost_pln || 0), 0);

      // Peak hour
      const hourCounts: Record<number, number> = {};
      (callLogs || []).forEach(l => {
        if (l.created_at) {
          const h = new Date(l.created_at).getHours();
          hourCounts[h] = (hourCounts[h] || 0) + 1;
        }
      });
      const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
      const peakHourLabel = peakHour ? `${peakHour[0].padStart(2, "0")}:00 (${peakHour[1]} rozmów)` : "—";

      const { count: transfers } = await supabaseAdmin
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("business_id", b.id)
        .not("routed_to_extension", "is", null);

      const { count: consultantCount } = await supabaseAdmin
        .from("business_consultants")
        .select("*", { count: "exact", head: true })
        .eq("business_id", b.id);

      const { data: portRequest } = await supabaseAdmin
        .from("port_requests")
        .select("phone_number, status")
        .eq("business_id", b.id)
        .order("created_at", { ascending: false })
        .limit(1);

      return {
        ...b,
        whatsapp_number: (b as any).whatsapp_number || null,
        consultant_count: consultantCount || 0,
        ported_phone: portRequest?.[0]?.phone_number || null,
        port_status: portRequest?.[0]?.status || null,
        stats: {
          totalCalls: totalCalls || 0,
          orders: orders || 0,
          spam: spamCalls || 0,
          bookings: bookings || 0,
          smsCount: smsCount || 0,
          totalMinutes: Math.round(totalMinutes * 10) / 10,
          totalCost: totalCost.toFixed(2),
          peakHour: peakHourLabel,
          transfers: transfers || 0,
        },
      };
    })
  );

  return NextResponse.json(result);
}

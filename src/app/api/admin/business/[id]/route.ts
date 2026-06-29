import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import { getPlanConfig } from "@/lib/pricing";
import type { PlanKey } from "@/types/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { id } = await params;

  // Fetch business
  const { data: business, error: bizErr } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Fetch call logs
  const { data: callLogs } = await supabaseAdmin
    .from("call_logs")
    .select("*")
    .is("deleted_at", null)
    .eq("business_id", id)
    .order("created_at", { ascending: false })
    .limit(500);

  // Fetch conversations
  const { data: conversations } = await supabaseAdmin
    .from("conversations")
    .select("id, channel, status, duration_seconds, message_count, sentiment, tokens_total, created_at")
    .eq("business_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  // Fetch reservations
  const { data: reservations } = await supabaseAdmin
    .from("reservations")
    .select("*, call_logs(ai_summary, classification)")
    .eq("business_id", id)
    .order("reserved_at", { ascending: false })
    .limit(100);

  // Compute stats
  const logs = callLogs || [];
  const convs = conversations || [];

  const totalCalls = logs.length;
  const totalConversations = convs.length;
  const totalSeconds = logs.reduce((a, l) => a + (l.duration_seconds || 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const totalCost = logs.reduce((a, l) => a + Number(l.cost_pln || 0), 0);
  const orders = logs.filter(l => l.classification === "order").length;
  const inquiries = logs.filter(l => l.classification === "inquiry" || l.classification === "question").length;
  const bookings = logs.filter(l => l.classification === "booking").length;
  const spam = logs.filter(l => l.classification === "spam").length;

  const totalTokens = logs.reduce((a, l) => a + (l.tokens_total || 0), 0);
  const convTokens = convs.reduce((a, c) => a + (c.tokens_total || 0), 0);

  // Source breakdown
  const sourceBreakdown = {
    phone: logs.length,
    voice: convs.filter(c => c.channel === "voice").length,
    web: convs.filter(c => c.channel === "web").length,
    widget: convs.filter(c => c.channel === "widget").length,
    sms: convs.filter(c => c.channel === "sms").length,
  };

  // Monthly usage info
  const config = getPlanConfig(business.current_plan as PlanKey);
  const minutesUsed = business.minutes_used_this_week || 0;
  const tokensUsed = business.tokens_used_this_month || 0;
  const monthlyMinutesLimit = config?.monthlyVoiceMinutes || 0;
  const monthlyTokensLimit = config?.monthlyTokens || 0;

  return NextResponse.json({
    business: {
      id: business.id,
      name: business.name,
      current_plan: business.current_plan,
      subscription_status: business.subscription_status,
      suspended: business.suspended,
      trial_ends_at: business.trial_ends_at,
      subscription_current_period_end: business.subscription_current_period_end,
      minutes_used_this_week: minutesUsed,
      tokens_used_this_month: tokensUsed,
      monthlyMinutesLimit,
      monthlyTokensLimit,
      phone: business.phone,
      twilio_number: business.twilio_number,
      industry: business.industry,
      website_url: business.website_url,
      created_at: business.created_at,
      owner_uid: business.owner_uid,
    },
    stats: {
      totalCalls,
      totalConversations,
      totalMinutes,
      totalCost: totalCost.toFixed(2),
      orders,
      inquiries,
      bookings,
      spam,
      totalTokens: totalTokens + convTokens,
      callTokens: totalTokens,
      convTokens,
    },
    sourceBreakdown,
    callLogs: logs.slice(0, 100),
    conversations: convs.slice(0, 100),
    reservations: reservations || [],
  });
}



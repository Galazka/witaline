import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWeeklySummaryEmail } from "@/lib/email";

function getWeekRange() {
  const d = new Date();
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

function checkCronAuth(request: Request): boolean {
  const header = request.headers.get("x-internal-secret");
  if (header === process.env.CRON_SECRET) return true;
  const { searchParams } = new URL(request.url);
  return searchParams.get("key") === process.env.CRON_SECRET;
}

export async function POST(request: Request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const week = getWeekRange();
  const { data: businesses } = await supabaseAdmin
    .from("businesses")
    .select("id, name, owner_uid")
    .eq("suspended", false);

  if (!businesses?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const biz of businesses) {
    try {
      const { data: owner } = await supabaseAdmin
        .from("auth.users")
        .select("email")
        .eq("id", biz.owner_uid)
        .single();

      if (!owner?.email) continue;

      const [calls, leads, sms] = await Promise.all([
        supabaseAdmin.from("call_logs").select("duration_seconds").eq("business_id", biz.id).gte("created_at", week.start).lte("created_at", week.end),
        supabaseAdmin.from("leads").select("id", { count: "exact", head: true }).eq("business_id", biz.id).gte("created_at", week.start).lte("created_at", week.end),
        supabaseAdmin.from("sms_logs").select("id", { count: "exact", head: true }).eq("business_id", biz.id).gte("created_at", week.start).lte("created_at", week.end),
      ]);

      const totalMinutes = Math.round((calls.data || []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60);

      await sendWeeklySummaryEmail(owner.email, biz.name, {
        calls: calls.data?.length || 0,
        leads: leads.count || 0,
        minutes: totalMinutes,
        smsSent: sms.count || 0,
      });

      sent++;
    } catch (e) {
      errors.push(`${biz.name}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return NextResponse.json({ ok: true, sent, errors: errors.length > 0 ? errors : undefined });
}

export const GET = POST;

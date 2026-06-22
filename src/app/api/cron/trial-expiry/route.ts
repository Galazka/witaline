import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendTrialExpiryEmail } from "@/lib/email";

export async function POST(request: Request) {
  const auth = request.headers.get("x-internal-secret");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);

  // Find businesses where trial ends in 3 days
  const { data: expiring } = await supabaseAdmin
    .from("businesses")
    .select("id, name, owner_uid, trial_ends_at")
    .eq("subscription_status", "trialing")
    .gte("trial_ends_at", now.toISOString())
    .lte("trial_ends_at", threeDaysFromNow.toISOString());

  if (!expiring?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const biz of expiring) {
    try {
      const { data: owner } = await supabaseAdmin
        .from("auth.users")
        .select("email")
        .eq("id", biz.owner_uid)
        .single();

      if (!owner?.email) continue;

      const daysLeft = Math.ceil((new Date(biz.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      await sendTrialExpiryEmail(owner.email, biz.name, Math.max(1, daysLeft));
      sent++;
    } catch (e) {
      errors.push(`${biz.name}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  // Auto-suspend businesses with fully expired trials
  const { data: expired } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("subscription_status", "trialing")
    .lt("trial_ends_at", now.toISOString());

  if (expired?.length) {
    await supabaseAdmin
      .from("businesses")
      .update({ suspended: true })
      .in("id", expired.map(b => b.id));
  }

  return NextResponse.json({
    ok: true,
    sent,
    expired_suspended: expired?.length || 0,
    errors: errors.length > 0 ? errors : undefined,
  });
}

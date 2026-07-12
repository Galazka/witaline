import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/email";
import { WITALINE_CONTACT_EMAIL } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl";

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

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: inactive } = await supabaseAdmin
    .from("businesses")
    .select("id, name, owner_uid, owner_email")
    .eq("suspended", false)
    .not("owner_email", "is", null);

  if (!inactive?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const biz of inactive) {
    try {
      const { count } = await supabaseAdmin
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("business_id", biz.id)
        .gte("created_at", sevenDaysAgo);

      if (count && count > 0) continue;

      const { count: totalCalls } = await supabaseAdmin
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("business_id", biz.id);

      if (!totalCalls || totalCalls === 0) continue;

      const result = await sendEmail({
        to: biz.owner_email!,
        templateKey: "churn_prevention",
        variables: {
          businessName: biz.name,
          dashboardUrl: `${APP_URL}/dashboard`,
        },
        categories: ["churn-prevention"],
      });

      if (result.ok) sent++;
      else errors.push(`${biz.name}: ${result.error}`);
    } catch (e) {
      errors.push(`${biz.name}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return NextResponse.json({ ok: true, sent, errors: errors.length > 0 ? errors : undefined });
}

export const GET = POST;

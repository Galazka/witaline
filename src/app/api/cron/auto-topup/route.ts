import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { executeAutoTopup } from "@/lib/auto-topup";

export async function POST(request: Request) {
  const auth = request.headers.get("x-internal-secret");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: businesses } = await supabaseAdmin
    .from("businesses")
    .select("id, name, phone, owner_uid, auto_topup_enabled, auto_topup_minutes_threshold, auto_topup_pack_size, prepaid_minutes, stripe_customer_id")
    .eq("auto_topup_enabled", true)
    .not("stripe_customer_id", "is", null);

  if (!businesses?.length) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;
  const errors: string[] = [];

  for (const biz of businesses) {
    try {
      const minutesLeft = parseFloat(String(biz.prepaid_minutes || "0"));
      const threshold = biz.auto_topup_minutes_threshold || 20;
      if (minutesLeft >= threshold) continue;

      const result = await executeAutoTopup(biz.id, biz);
      if (result.ok) processed++;
      else errors.push(`${biz.name}: ${result.reason}`);
    } catch (e: any) {
      errors.push(`${biz.name}: ${e?.message || "Unknown error"}`);
    }
  }

  return NextResponse.json({ ok: true, processed, errors: errors.length > 0 ? errors : undefined });
}

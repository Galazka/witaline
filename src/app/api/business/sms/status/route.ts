import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("sms_limit, sms_used, sms_extra_purchased")
    .eq("id", businessId)
    .single();

  if (!biz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const total = (biz.sms_limit || 0) + (biz.sms_extra_purchased || 0);
  const used = biz.sms_used || 0;

  return NextResponse.json({
    limit: biz.sms_limit || 0,
    extraPurchased: biz.sms_extra_purchased || 0,
    used,
    totalCapacity: total,
    remaining: Math.max(0, total - used),
    usagePercent: total > 0 ? Math.round((used / total) * 100) : 0,
  });
}

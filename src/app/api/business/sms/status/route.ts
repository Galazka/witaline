import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSmsRemaining, getWaRemaining } from "@/lib/sms-pricing";

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
    .select("sms_limit, sms_used, sms_extra_purchased, wa_limit, wa_used, wa_extra_purchased")
    .eq("id", businessId)
    .single();

  if (!biz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const smsTotal = (biz.sms_limit || 0) + (biz.sms_extra_purchased || 0);
  const smsUsed = biz.sms_used || 0;
  const smsRemaining = getSmsRemaining(biz);
  const waRemaining = getWaRemaining(biz);
  const waTotal = (biz.wa_limit || 0) + (biz.wa_extra_purchased || 0);

  return NextResponse.json({
    // SMS fields
    sms_limit: biz.sms_limit || 0,
    sms_used: smsUsed,
    sms_extra_purchased: biz.sms_extra_purchased || 0,
    sms_remaining: smsRemaining,
    sms_total: smsTotal,
    sms_usage_percent: smsTotal > 0 ? Math.round((smsUsed / smsTotal) * 100) : 0,
    // WhatsApp fields
    wa_limit: biz.wa_limit || 0,
    wa_used: biz.wa_used || 0,
    wa_extra_purchased: biz.wa_extra_purchased || 0,
    wa_remaining: waRemaining,
    wa_total: waTotal,
    // Legacy fields (backwards compat)
    limit: biz.sms_limit || 0,
    extraPurchased: biz.sms_extra_purchased || 0,
    used: smsUsed,
    totalCapacity: smsTotal,
    remaining: smsRemaining,
    usagePercent: smsTotal > 0 ? Math.round((smsUsed / smsTotal) * 100) : 0,
  });
}
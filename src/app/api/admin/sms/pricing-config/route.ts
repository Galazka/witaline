import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import {
  getSmsPricingConfig,
  DEFAULT_SMS_MARKUP_PERCENT,
  TWILIO_SMS_COST_PLN,
  SMS_PACKAGES,
  formatSmsCost,
} from "@/lib/sms-pricing";

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const config = getSmsPricingConfig();

  const { data: businesses } = await supabaseAdmin
    .from("businesses")
    .select("id, name, sms_limit, sms_used, sms_extra_purchased, sms_enabled, suspended");

  const businessList = (businesses || []).map((b) => {
    const total = (b.sms_limit || 0) + (b.sms_extra_purchased || 0);
    const used = b.sms_used || 0;
    return {
      id: b.id,
      name: b.name,
      smsLimit: b.sms_limit || 0,
      smsExtra: b.sms_extra_purchased || 0,
      smsUsed: used,
      totalCapacity: total,
      remaining: Math.max(0, total - used),
      usagePercent: total > 0 ? Math.round((used / total) * 100) : 0,
      smsEnabled: b.sms_enabled ?? true,
      suspended: b.suspended,
    };
  });

  return NextResponse.json({
    config: {
      witalineCostPerSms: config.witalineCostPerSms,
      clientPricePerSms: config.clientPricePerSms,
      marginPerSms: config.marginPerSms,
      markupPercent: config.markupPercent,
    },
    packages: {
      sms: SMS_PACKAGES,
    },
    twilioCosts: {
      smsPerSegment: TWILIO_SMS_COST_PLN,
    },
    defaults: {
      smsMarkupPercent: DEFAULT_SMS_MARKUP_PERCENT,
    },
    businesses: businessList,
  });
}

export async function PATCH(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const body = await request.json();
  const { action } = body;

  if (action === "update_limits") {
    const { business_id, sms_limit, sms_extra_purchased, sms_enabled } = body;
    if (!business_id) return NextResponse.json({ error: "Missing business_id" }, { status: 400 });
    const updateData: Record<string, unknown> = {};
    if (sms_limit !== undefined) updateData.sms_limit = sms_limit;
    if (sms_extra_purchased !== undefined) updateData.sms_extra_purchased = sms_extra_purchased;
    if (sms_enabled !== undefined) updateData.sms_enabled = sms_enabled;
    const { error: dbError } = await supabaseAdmin.from("businesses").update(updateData).eq("id", business_id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "toggle_all") {
    const { enabled } = body;
    const { error: dbError } = await supabaseAdmin
      .from("businesses")
      .update({ sms_enabled: enabled })
      .neq("name", "WitaLine");
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ success: true, enabled });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

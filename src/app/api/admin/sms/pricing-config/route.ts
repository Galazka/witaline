import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import {
  getSmsPricingConfig,
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
      smsMarkupPercent: 100,
    },
    businesses: businessList,
  });
}

const updateLimitsSchema = z.object({
  action: z.literal("update_limits"),
  business_id: z.string().uuid(),
  sms_limit: z.number().int().min(0).optional(),
  sms_extra_purchased: z.number().int().min(0).optional(),
  sms_enabled: z.boolean().optional(),
});

const toggleAllSchema = z.object({
  action: z.literal("toggle_all"),
  enabled: z.boolean(),
});

export async function PATCH(request: Request) {
  const auth = await checkAdminAuth();
  if (auth.error) return auth.error;

  const raw = await request.json();

  if (raw.action === "update_limits") {
    const parsed = updateLimitsSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map(i => `${i.path}: ${i.message}`).join("; ") }, { status: 400 });
    }
    const { business_id, sms_limit, sms_extra_purchased, sms_enabled } = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (sms_limit !== undefined) updateData.sms_limit = sms_limit;
    if (sms_extra_purchased !== undefined) updateData.sms_extra_purchased = sms_extra_purchased;
    if (sms_enabled !== undefined) updateData.sms_enabled = sms_enabled;
    const { error: dbError } = await supabaseAdmin.from("businesses").update(updateData).eq("id", business_id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (raw.action === "toggle_all") {
    const parsed = toggleAllSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map(i => `${i.path}: ${i.message}`).join("; ") }, { status: 400 });
    }
    const { enabled } = parsed.data;
    const { error: dbError } = await supabaseAdmin
      .from("businesses")
      .update({ sms_enabled: enabled })
      .neq("name", "WitaLine");
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ success: true, enabled });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

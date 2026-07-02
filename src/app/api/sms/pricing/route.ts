import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSmsPricingConfig, SMS_PACKAGES, formatSmsCost } from "@/lib/sms-pricing";
import { type Currency } from "@/lib/pricing";

/** GET /api/sms/pricing?businessId=xxx&currency=pln  — client-facing SMS pricing */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const currency = (searchParams.get("currency") || "pln") as Currency;

  let overrides = null;
  if (businessId) {
    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("sms_limit, sms_used, sms_extra_purchased")
      .eq("id", businessId)
      .single();
    if (biz) {
      overrides = {
        smsRemaining: Math.max(0, (biz.sms_limit || 0) + (biz.sms_extra_purchased || 0) - (biz.sms_used || 0)),
      };
    }
  }

  const config = getSmsPricingConfig();

  return NextResponse.json({
    witalineCostPerSms: config.witalineCostPerSms,
    clientPricePerSms: config.clientPricePerSms,
    marginPerSms: config.marginPerSms,
    markupPercent: config.markupPercent,
    smsPackages: SMS_PACKAGES.map(p => ({
      smsCount: p.smsCount,
      clientPricePLN: p.clientPricePLN,
      clientPriceFormatted: formatSmsCost(p.clientPricePLN, currency),
      pricePerSmsPLN: p.pricePerSmsPLN,
    })),
    ...overrides,
  });
}

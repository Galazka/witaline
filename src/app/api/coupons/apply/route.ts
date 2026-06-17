import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getBestDiscount, recordCouponUsage } from "@/lib/coupons";
import type { PlanKey } from "@/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, couponCode } = await request.json();

  const validPlans = ["start_100", "pro_500", "enterprise_2000", "elastic_0", "pro_249", "lux_599"];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const discount = await getBestDiscount(plan as PlanKey, couponCode);

  return NextResponse.json({
    originalPrice: discount.originalPrice,
    finalPrice: discount.finalPrice,
    discountApplied: discount.discountApplied,
    source: discount.source,
  });
}

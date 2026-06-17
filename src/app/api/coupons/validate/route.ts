import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";
import type { PlanKey } from "@/types/database";

export async function POST(request: Request) {
  const { code, plan } = await request.json();

  if (!code || !plan) {
    return NextResponse.json({ error: "Missing code or plan" }, { status: 400 });
  }

  const validPlans = ["start_100", "pro_500", "enterprise_2000", "elastic_0", "pro_249", "lux_599"];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const result = await validateCoupon(code, plan as PlanKey);

  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    coupon: {
      code: result.coupon!.code,
      description: result.coupon!.description,
      discount_percent: result.coupon!.discount_percent,
      discount_amount: result.coupon!.discount_amount,
    },
  });
}

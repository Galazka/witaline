import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Coupon, DiscountRule, PlanKey } from "@/types/database";

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discountedPrice?: number;
  originalPrice?: number;
}

export interface DiscountResult {
  originalPrice: number;
  finalPrice: number;
  discountApplied: string;
  source: "coupon" | "auto_discount" | "none";
}

/**
 * Validate a coupon code and return discount info
 */
export async function validateCoupon(
  code: string,
  plan: PlanKey
): Promise<CouponValidationResult> {
  const { data: coupon, error } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("active", true)
    .single();

  if (error || !coupon) {
    return { valid: false, error: "Kupon nie istnieje lub jest nieaktywny." };
  }

  const now = new Date();

  // Check validity window
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, error: "Kupon jeszcze nie jest aktywny." };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, error: "Kupon wygasł." };
  }

  // Check usage limit
  if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
    return { valid: false, error: "Kupon został już wykorzystany maksymalną liczbę razy." };
  }

  // Check plan applicability
  if (coupon.applicable_plans && coupon.applicable_plans.length > 0) {
    if (!coupon.applicable_plans.includes(plan)) {
      return { valid: false, error: `Kupon nie obowiązuje dla planu ${plan}.` };
    }
  }

  return { valid: true, coupon: coupon as Coupon };
}

/**
 * Get the best available discount for a plan (auto-discount or coupon)
 */
export async function getBestDiscount(
  plan: PlanKey,
  couponCode?: string
): Promise<DiscountResult> {
  const { getPlanConfig } = await import("@/lib/pricing");
  const originalPrice = getPlanConfig(plan).pricePLN;

  // Check auto-discount rules first
  const now = new Date().toISOString();
  const { data: activeRules } = await supabaseAdmin
    .from("discount_rules")
    .select("*")
    .eq("active", true)
    .lte("start_at", now)
    .gte("end_at", now);

  let bestAutoDiscount: DiscountRule | null = null;
  let bestAutoPrice = originalPrice;

  if (activeRules) {
    for (const rule of activeRules) {
      if (rule.max_uses_total > 0 && rule.used_count >= rule.max_uses_total) continue;
      if (rule.target_plans && rule.target_plans.length > 0 && !rule.target_plans.includes(plan)) continue;

      const price = applyDiscount(originalPrice, rule);
      if (price < bestAutoPrice) {
        bestAutoPrice = price;
        bestAutoDiscount = rule as DiscountRule;
      }
    }
  }

  // Check coupon if provided
  if (couponCode) {
    const validation = await validateCoupon(couponCode, plan);
    if (validation.valid && validation.coupon) {
      const couponPrice = applyDiscount(originalPrice, {
        discount_percent: validation.coupon.discount_percent ?? undefined,
        discount_amount: validation.coupon.discount_amount ?? undefined,
      });

      // Coupon wins if it's better than auto-discount
      if (couponPrice <= bestAutoPrice) {
        return {
          originalPrice,
          finalPrice: couponPrice,
          discountApplied: `Kupon: ${validation.coupon.code}`,
          source: "coupon",
        };
      }
    }
  }

  // Return auto-discount if found and better
  if (bestAutoDiscount) {
    return {
      originalPrice,
      finalPrice: bestAutoPrice,
      discountApplied: `Automatyczna zniżka: ${bestAutoDiscount.name}`,
      source: "auto_discount",
    };
  }

  return {
    originalPrice,
    finalPrice: originalPrice,
    discountApplied: "",
    source: "none",
  };
}

/**
 * Record coupon usage
 */
export async function recordCouponUsage(
  couponId: string,
  businessId: string,
  originalPrice: number,
  finalPrice: number
): Promise<void> {
  await supabaseAdmin.from("coupon_usages").insert({
    coupon_id: couponId,
    business_id: businessId,
    original_price: originalPrice,
    final_price: finalPrice,
  });

  await supabaseAdmin.rpc("increment_coupon_usage", { coupon_id: couponId });
}

/**
 * Record auto-discount usage
 */
export async function recordAutoDiscountUsage(ruleId: string): Promise<void> {
  await supabaseAdmin.rpc("increment_discount_rule_usage", { rule_id: ruleId });
}

function applyDiscount(
  price: number,
  discount: { discount_percent?: number; discount_amount?: number }
): number {
  if (discount.discount_percent) {
    return Math.round(price * (1 - discount.discount_percent / 100) * 100) / 100;
  }
  if (discount.discount_amount) {
    return Math.max(0, Math.round((price - discount.discount_amount) * 100) / 100);
  }
  return price;
}

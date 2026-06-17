import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    _stripe = new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
  }
  return _stripe;
}

export const PRICE_IDS: Record<string, string> = {
  // Legacy — stare plany (usunięte, ale zachowane dla istniejących subskrypcji)
  start_100: process.env.STRIPE_PRICE_START || "",
  pro_500: process.env.STRIPE_PRICE_PRO || "",
  enterprise_2000: process.env.STRIPE_PRICE_ENTERPRISE || "",
  elastic_0: process.env.STRIPE_PRICE_BASE_MONTHLY || "",
};

export const ENTERPRISE_PRICE_IDS: Record<string, string> = {
  enterprise_500: process.env.STRIPE_PRICE_ENTERPRISE_500 || "",
  enterprise_1500: process.env.STRIPE_PRICE_ENTERPRISE_1500 || "",
  enterprise_5000: process.env.STRIPE_PRICE_ENTERPRISE_5000 || "",
  enterprise_5000plus: process.env.STRIPE_PRICE_ENTERPRISE_5000PLUS || "",
};





export const PLANS = {
  START: 199,
  PRO: 249,
  GROWTH: 399,
  LUX: 599,
  ENTERPRISE: 999
};

export const PLAN_NAMES = {
  START: "Start",
  PRO: "Pro",
  GROWTH: "Growth",
  LUX: "Lux",
  ENTERPRISE: "Enterprise"
};

export const ELASTIC_TIERS = [
  { minMinutes: 0, maxMinutes: 50, from: 0, to: 50, rate: 1.49 },
  { minMinutes: 51, maxMinutes: 200, from: 51, to: 200, rate: 1.29 },
  { minMinutes: 201, maxMinutes: 500, from: 201, to: 500, rate: 1.15 },
  { minMinutes: 501, maxMinutes: 2000, from: 501, to: 2000, rate: 1.05 },
  { minMinutes: 2001, maxMinutes: Infinity, from: 2001, to: Infinity, rate: 0.99 }
];

export const billingModels = ["elastic", "fixed"];

export const plans = [
  { label: "Start", value: "start", price: 199, pricePLN: "199 PLN", minutes: 250, overagePerToken: 0.002, monthlyTokens: 250000 },
  { label: "Pro", value: "pro", price: 249, pricePLN: "249 PLN", minutes: 300, overagePerToken: 0.0015, monthlyTokens: 300000 },
  { label: "Growth", value: "growth", price: 399, pricePLN: "399 PLN", minutes: 600, overagePerToken: 0.001, monthlyTokens: 600000 },
  { label: "Lux", value: "lux", price: 599, pricePLN: "599 PLN", minutes: 800, overagePerToken: 0.0008, monthlyTokens: 800000 },
  { label: "Enterprise", value: "enterprise", price: 999, pricePLN: "999 PLN", minutes: 1500, overagePerToken: 0.0005, monthlyTokens: 1500000 }
];

export const INTERNAL_COST_PER_MIN = 0.65;

export function calculateElasticPrice(minutes: number): number {
  return minutes * getElasticRate(minutes);
}

export function calculateCost(durationSeconds: number, planKey: string): number {
  const minutes = durationSeconds / 60;
  if (planKey.startsWith("elastic")) return minutes * getElasticRate(minutes);
  const config = getPlanConfig(planKey);
  return config ? minutes * (config.price / config.minutes) : minutes * ELASTIC_TIERS[0].rate;
}

export function getPlanConfig(planKey: string) {
  const normalized = planKey.toUpperCase().replace(/_?(\d+).*/, "").trim();
  const plan = Object.keys(PLANS).find(k => k === normalized);
  if (!plan || !PLANS[plan as keyof typeof PLANS]) {
    return { name: "Custom", planId: "custom", label: "Custom", price: 0, pricePLN: "0 PLN", pricePerMonth: 0, minutes: 0, monthlyVoiceMinutes: 0, monthlyTokens: 0, maxConsultants: 3, overagePerToken: 0, features: [] };
  }
  const price = PLANS[plan as keyof typeof PLANS];
  const p = plans.find(x => x.label === PLAN_NAMES[plan as keyof typeof PLAN_NAMES]);
  return {
    name: PLAN_NAMES[plan as keyof typeof PLAN_NAMES],
    planId: plan,
    label: p?.label || PLAN_NAMES[plan as keyof typeof PLAN_NAMES],
    price,
    pricePLN: p?.pricePLN || `${price} PLN`,
    pricePerMonth: price,
    minutes: p?.minutes || 250,
    monthlyVoiceMinutes: p?.minutes || 250,
    monthlyTokens: p?.monthlyTokens || 250000,
    maxConsultants: plan === "START" ? 1 : plan === "PRO" ? 3 : plan === "GROWTH" ? 5 : plan === "LUX" ? 10 : 99,
    overagePerToken: p?.overagePerToken || 0.002,
    features: []
  };
}

export function getElasticRate(minutes: number): number {
  for (const tier of ELASTIC_TIERS) {
    if (minutes >= tier.from && minutes <= tier.to) return tier.rate;
  }
  return ELASTIC_TIERS[ELASTIC_TIERS.length - 1].rate;
}

export function getUsedPercentage(used: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, (used / total) * 100);
}

export const ADDONS = {
  ownNumber: { name: "Własny numer", price: 29 },
  googleCalendar: { name: "Google Calendar", price: 19 },
  crm: { name: "CRM", price: 49 },
  voiceClone: { name: "Klonowanie głosu", price: 49 },
  unlimitedConsultants: { name: "Nieograniczeni konsultanci", price: 49 },
  prioritySupport: { name: "Priorytetowe wsparcie", price: 29 },
  sla247: { name: "SLA 24/7", price: 99 }
};

export function formatPLN(amount: number): string {
  return `${amount.toFixed(0).replace(".", ",")} PLN`;
}
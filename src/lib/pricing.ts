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
  { from: 0, to: 50, rate: 1.49 },
  { from: 51, to: 200, rate: 1.29 },
  { from: 201, to: 500, rate: 1.15 },
  { from: 501, to: 2000, rate: 1.05 },
  { from: 2001, to: Infinity, rate: 0.99 }
];

export function getPlanConfig(planKey: string) {
  const normalized = planKey.toUpperCase().replace(/_?(\d+).*/, '').trim() as keyof typeof PLANS;
  const plan = Object.keys(PLANS).find(k => k === normalized) as keyof typeof PLANS | undefined;
  if (!plan || !PLANS[plan]) return null;
  const price = PLANS[plan];
  return {
    name: PLAN_NAMES[plan],
    price,
    pricePerMonth: price,
    minutes: plan === "START" ? 250 : plan === "PRO" ? 300 : plan === "GROWTH" ? 600 : plan === "LUX" ? 800 : 1500,
    features: [],
    monthlyVoiceMinutes: plan === "START" ? 250 : plan === "PRO" ? 300 : plan === "GROWTH" ? 600 : plan === "LUX" ? 800 : 1500,
    monthlyTokens: plan === "START" ? 250000 : plan === "PRO" ? 300000 : plan === "GROWTH" ? 600000 : plan === "LUX" ? 800000 : 1500000
  };
}

export function getElasticRate(minutes: number): number {
  for (const tier of ELASTIC_TIERS) {
    if (minutes >= tier.from && minutes <= tier.to) return tier.rate;
  }
  return ELASTIC_TIERS[ELASTIC_TIERS.length - 1].rate;
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

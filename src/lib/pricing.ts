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

export interface ElasticTier {
  minMinutes: number;
  maxMinutes: number;
  from: number;
  to: number;
  rate: number;
  ratePerMin: number;
}

export const ELASTIC_TIERS: ElasticTier[] = [
  { minMinutes: 0, maxMinutes: 50, from: 0, to: 50, rate: 1.49, ratePerMin: 1.49 },
  { minMinutes: 51, maxMinutes: 200, from: 51, to: 200, rate: 1.29, ratePerMin: 1.29 },
  { minMinutes: 201, maxMinutes: 500, from: 201, to: 500, rate: 1.15, ratePerMin: 1.15 },
  { minMinutes: 501, maxMinutes: 2000, from: 501, to: 2000, rate: 1.05, ratePerMin: 1.05 },
  { minMinutes: 2001, maxMinutes: Infinity, from: 2001, to: Infinity, rate: 0.99, ratePerMin: 0.99 }
];

export const billingModels = [
  { key: "self_service", label: "Self-Service", desc: "Pay-as-you-go, konfiguracja w 15 minut", icon: "🚀", features: ["Własny numer telefonu", "Panel administracyjny", "Podstawowa analityka", "Support e-mail"] },
  { key: "enterprise", label: "Enterprise", desc: "Dedykowane wdrożenie, SLA 24/7, własny onboarding", icon: "🏢", features: ["Wszystko z Self-Service", "Priorytetowe wsparcie 24/7", "Niestandardowe integracje", "SLA 99.9%"] },
];

export const plans: Record<string, PlanConfig> = {
  start: { label: "Start", value: "start", price: 199, pricePLN: "199 PLN", minutes: 250, overagePerToken: 0.002, monthlyTokens: 250000, monthlyVoiceMinutes: 250, maxConsultants: 3, features: [] },
  pro: { label: "Pro", value: "pro", price: 249, pricePLN: "249 PLN", minutes: 300, overagePerToken: 0.0015, monthlyTokens: 300000, monthlyVoiceMinutes: 300, maxConsultants: 3, features: [] },
  growth: { label: "Growth", value: "growth", price: 399, pricePLN: "399 PLN", minutes: 600, overagePerToken: 0.001, monthlyTokens: 600000, monthlyVoiceMinutes: 600, maxConsultants: 3, features: [] },
  lux: { label: "Lux", value: "lux", price: 599, pricePLN: "599 PLN", minutes: 800, overagePerToken: 0.0008, monthlyTokens: 800000, monthlyVoiceMinutes: 800, maxConsultants: 3, features: [] },
  enterprise: { label: "Enterprise", value: "enterprise", price: 999, pricePLN: "999 PLN", minutes: 1500, overagePerToken: 0.0005, monthlyTokens: 1500000, monthlyVoiceMinutes: 1500, maxConsultants: 3, features: [] },
  self_service: { label: "Self-Service", value: "self_service", price: 0, pricePLN: "0 PLN", minutes: 0, overagePerToken: 0.002, monthlyTokens: 0, monthlyVoiceMinutes: 0, maxConsultants: 1, features: [] },
};

export const INTERNAL_COST_PER_MIN = 0.65;

export type Currency = "pln" | "eur" | "usd";

export const CURRENCY_RATES: Record<Currency, number> = {
  pln: 1,
  eur: 0.23,
  usd: 0.26,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  pln: "zł",
  eur: "€",
  usd: "$",
};

export function convertPrice(plnAmount: number, to: Currency): number {
  return Math.round(plnAmount * CURRENCY_RATES[to] * 100) / 100;
}

export function currencyCode(currency: Currency): string {
  return currency.toUpperCase();
}

export interface PlanConfig {
  label: string;
  value: string;
  price: number;
  pricePLN: string;
  minutes: number;
  overagePerToken: number;
  monthlyTokens: number;
  monthlyVoiceMinutes: number;
  maxConsultants: number;
  features: string[];
}

export interface ElasticPriceBreakdown {
  ratePerMin: number;
  monthlyNetto: number;
  monthlyBrutto: number;
  costTotal: number;
  profitTotal: number;
  profitPerMin: number;
  marginPercent: number;
}

export function calculateElasticPrice(minutes: number): ElasticPriceBreakdown {
  const ratePerMin = getElasticRate(minutes);
  const monthlyNetto = minutes * ratePerMin;
  const monthlyBrutto = Math.round(monthlyNetto * 1.23 * 100) / 100;
  const costTotal = Math.round(minutes * INTERNAL_COST_PER_MIN * 100) / 100;
  const profitTotal = Math.round((monthlyNetto - costTotal) * 100) / 100;
  const profitPerMin = Math.round((profitTotal / minutes) * 100) / 100;
  const marginPercent = Math.round((profitTotal / monthlyNetto) * 100);
  return { ratePerMin, monthlyNetto, monthlyBrutto, costTotal, profitTotal, profitPerMin, marginPercent };
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
  const p = Object.values(plans).find(x => x.label === PLAN_NAMES[plan as keyof typeof PLAN_NAMES]);
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

export function formatPLN(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.]/g, "")) : amount;
  return `${num.toFixed(0).replace(".", ",")} PLN`;
}

export const CONFIG = {
  addonOwnNumber: 29,
  addonGoogleCalendar: 19,
  addonCrm: 49,
  addonVoiceClone: 49,
  addonUnlimitedConsultants: 49,
  addonPrioritySupport: 29,
  addonSla247: 99,
};

export type SelfServiceConfig = {
  minutes: number;
  ownNumber: boolean;
  googleCalendar: boolean;
  crm: boolean;
  voiceClone: boolean;
  unlimitedConsultants: boolean;
  prioritySupport: boolean;
  sla247: boolean;
};

export function formatPrice(amount: number, locale: string): string {
  const formatted = amount.toFixed(2).replace(".", ",");
  return `${formatted} PLN`;
}

export function formatPriceCurrency(amountPLN: number, currency: Currency, locale: string): string {
  const converted = convertPrice(amountPLN, currency);
  const fmt = converted.toFixed(2).replace(".", ",");
  if (currency === "pln") return `${fmt} zł`;
  if (currency === "eur") return `${fmt} €`;
  return `$${fmt}`;
}

export function formatPriceMin(ratePLN: number, currency: Currency): string {
  const converted = convertPrice(ratePLN, currency);
  const fmt = converted.toFixed(2).replace(".", ",");
  if (currency === "pln") return `${fmt} zł/min`;
  if (currency === "eur") return `${fmt} €/min`;
  return `$${fmt}/min`;
}

export function getPlanOverageRate(planKey: string): number {
  const normalized = planKey.toUpperCase().replace(/_?(\d+).*/, "").trim();
  const plan = Object.keys(PLANS).find(k => k === normalized);
  if (!plan) return 0.002;
  const p = Object.values(plans).find(x => x.label === PLAN_NAMES[plan as keyof typeof PLAN_NAMES]);
  return p?.overagePerToken ?? 0.002;
}

export function calculateSelfServicePrice(config: SelfServiceConfig): {
  details: { label: string; netto: number; hint?: string }[];
  monthlyNetto: number;
  monthlyBrutto: number;
  overageNetto: number;
} {
  const ratePerMin = getElasticRate(config.minutes);
  const baseNetto = Math.round(config.minutes * ratePerMin * 100) / 100;
  const details: { label: string; netto: number; hint?: string }[] = [
    { label: `Podstawa (${config.minutes} min × ${ratePerMin.toFixed(2).replace(".", ",")} PLN/min)`, netto: baseNetto },
  ];

  let addonsTotal = 0;
  const addonMap: [keyof SelfServiceConfig, string, number][] = [
    ["ownNumber", "Własny numer", CONFIG.addonOwnNumber],
    ["googleCalendar", "Google Calendar", CONFIG.addonGoogleCalendar],
    ["crm", "CRM", CONFIG.addonCrm],
    ["voiceClone", "Klon głosu", CONFIG.addonVoiceClone],
    ["unlimitedConsultants", "Nielimitowani konsultanci", CONFIG.addonUnlimitedConsultants],
    ["prioritySupport", "Priorytetowe wsparcie", CONFIG.addonPrioritySupport],
    ["sla247", "SLA 24/7", CONFIG.addonSla247],
  ];
  for (const [key, label, price] of addonMap) {
    if (config[key]) {
      details.push({ label, netto: price });
      addonsTotal += price;
    }
  }

  const monthlyNetto = baseNetto + addonsTotal;
  const monthlyBrutto = Math.round(monthlyNetto * 1.23 * 100) / 100;
  const overageNetto = ratePerMin;

  return { details, monthlyNetto, monthlyBrutto, overageNetto };
}

/**
 * SMS / WhatsApp Pricing System
 *
 * Two-tier pricing:
 *   WitaLine cost  = what we pay Twilio (actual cost per segment)
 *   Client price    = WitaLine cost + markup (per-business override possible)
 *   Markup          = WitaLine profit per SMS
 *
 * Admin sets base markup. Per-business overrides can add extra margin.
 */

import { convertPrice, type Currency } from "./pricing";

// ─── Twilio actual costs ───────────────────────────────────────────
// Poland outbound SMS: $0.0457/segment ≈ 0.19 PLN (at $1=4.15 PLN)
// With carrier fees ≈ 0.25 PLN real cost
export const TWILIO_SMS_COST_PLN = 0.25; // our real cost per SMS segment
export const TWILIO_WHATSAPP_COST_PLN = 0.30; // WhatsApp Business API ~$0.07

// ─── Default markup ────────────────────────────────────────────────
// Client pays: TWILIO_SMS_COST_PLN * (1 + DEFAULT_MARKUP_PERCENT/100)
// 0.25 * (1 + 1.0) = 0.50 PLN
export const DEFAULT_SMS_MARKUP_PERCENT = 100; // 100% = 2x
export const DEFAULT_SMS_BASE_PRICE_PLN = TWILIO_SMS_COST_PLN * (1 + DEFAULT_SMS_MARKUP_PERCENT / 100); // 0.50

export const DEFAULT_WHATSAPP_MARKUP_PERCENT = 80;
export const DEFAULT_WHATSAPP_BASE_PRICE_PLN =
  TWILIO_WHATSAPP_COST_PLN * (1 + DEFAULT_WHATSAPP_MARKUP_PERCENT / 100); // ~0.54

// ─── Default monthly SMS limits per plan ───────────────────────────
export const SMS_PLAN_LIMITS: Record<string, number> = {
  start: 50,
  pro: 100,
  growth: 150,
  lux: 200,
  enterprise: 500,
};

// ─── SMS prepaid package pricing (client price) ────────────────────
export interface SmsPackage {
  smsCount: number;
  clientPricePLN: number; // what client pays
  witalineCostPLN: number; // our Twilio cost
  marginPLN: number;
  pricePerSmsPLN: number;
}

export const SMS_PACKAGES: SmsPackage[] = [
  { smsCount: 50, clientPricePLN: 25, witalineCostPLN: 12.5, marginPLN: 12.5, pricePerSmsPLN: 0.50 },
  { smsCount: 100, clientPricePLN: 45, witalineCostPLN: 25, marginPLN: 20, pricePerSmsPLN: 0.45 },
  { smsCount: 200, clientPricePLN: 80, witalineCostPLN: 50, marginPLN: 30, pricePerSmsPLN: 0.40 },
  { smsCount: 500, clientPricePLN: 175, witalineCostPLN: 125, marginPLN: 50, pricePerSmsPLN: 0.35 },
  { smsCount: 1000, clientPricePLN: 300, witalineCostPLN: 250, marginPLN: 50, pricePerSmsPLN: 0.30 },
];

// ─── WhatsApp prepaid package pricing ──────────────────────────────
export interface WaPackage {
  waCount: number;
  clientPricePLN: number;
  witalineCostPLN: number;
}

export const WA_PACKAGES: WaPackage[] = [
  { waCount: 50, clientPricePLN: 30, witalineCostPLN: 15 },
  { waCount: 100, clientPricePLN: 55, witalineCostPLN: 30 },
  { waCount: 200, clientPricePLN: 100, witalineCostPLN: 60 },
  { waCount: 500, clientPricePLN: 220, witalineCostPLN: 150 },
];

// ─── Types ─────────────────────────────────────────────────────────

export interface SmsPricingConfig {
  /** Our Twilio cost per segment */
  witalineCostPerSms: number;
  /** Markup percent (e.g. 100 = 2x) */
  markupPercent: number;
  /** Client-facing price per SMS */
  clientPricePerSms: number;
  /** WitaLine profit per SMS */
  marginPerSms: number;
  /** WhatsApp pricing */
  waCostPerMsg: number;
  waClientPrice: number;
  waMargin: number;
}

export interface SmsCostBreakdown {
  segments: number;
  witalineCostPLN: number;
  clientPricePLN: number;
  marginPLN: number;
  marginPercent: number;
}

export function getSmsPricingConfig(
  businessOverrides?: {
    smsMarkupPercent?: number | null;
    smsBasePriceOverride?: number | null;
  } | null
): SmsPricingConfig {
  const markupPct = businessOverrides?.smsMarkupPercent ?? DEFAULT_SMS_MARKUP_PERCENT;
  const clientPrice =
    businessOverrides?.smsBasePriceOverride ??
    Math.round(TWILIO_SMS_COST_PLN * (1 + markupPct / 100) * 100) / 100;

  return {
    witalineCostPerSms: TWILIO_SMS_COST_PLN,
    markupPercent: markupPct,
    clientPricePerSms: clientPrice,
    marginPerSms: Math.round((clientPrice - TWILIO_SMS_COST_PLN) * 100) / 100,
    waCostPerMsg: TWILIO_WHATSAPP_COST_PLN,
    waClientPrice: DEFAULT_WHATSAPP_BASE_PRICE_PLN,
    waMargin: Math.round((DEFAULT_WHATSAPP_BASE_PRICE_PLN - TWILIO_WHATSAPP_COST_PLN) * 100) / 100,
  };
}

export function calculateSmsCost(segments: number, config?: SmsPricingConfig): SmsCostBreakdown {
  const cfg = config ?? getSmsPricingConfig();
  return {
    segments,
    witalineCostPLN: Math.round(segments * cfg.witalineCostPerSms * 100) / 100,
    clientPricePLN: Math.round(segments * cfg.clientPricePerSms * 100) / 100,
    marginPLN: Math.round(segments * cfg.marginPerSms * 100) / 100,
    marginPercent: cfg.markupPercent,
  };
}

export function formatSmsCost(costPLN: number, currency: Currency = "pln"): string {
  const converted = convertPrice(costPLN, currency);
  const fmt = converted.toFixed(2).replace(".", ",");
  if (currency === "pln") return `${fmt} zł`;
  if (currency === "eur") return `${fmt} €`;
  return `$${fmt}`;
}

export function findSmsPackage(smsCount: number): SmsPackage | undefined {
  return SMS_PACKAGES.find((p) => p.smsCount === smsCount);
}

export function findClosestSmsPackage(smsCount: number): SmsPackage {
  const sorted = [...SMS_PACKAGES].sort((a, b) => a.smsCount - b.smsCount);
  return sorted.reduce((prev, curr) =>
    Math.abs(curr.smsCount - smsCount) < Math.abs(prev.smsCount - smsCount) ? curr : prev
  );
}

export function getSmsPackagePrice(smsCount: number): number {
  const pkg = SMS_PACKAGES.find((p) => p.smsCount === smsCount);
  if (pkg) return pkg.clientPricePLN;
  // Custom amount — interpolate between nearest packages
  const sorted = [...SMS_PACKAGES].sort((a, b) => a.smsCount - b.smsCount);
  const lower = sorted.filter((p) => p.smsCount <= smsCount).pop();
  const upper = sorted.find((p) => p.smsCount >= smsCount);
  if (!lower && !upper) return smsCount * DEFAULT_SMS_BASE_PRICE_PLN;
  if (!lower && upper) return smsCount * (upper.clientPricePLN / upper.smsCount);
  if (lower && !upper) return smsCount * (lower.clientPricePLN / lower.smsCount);
  const ratio = (smsCount - lower!.smsCount) / (upper!.smsCount - lower!.smsCount);
  return Math.round((lower!.clientPricePLN + ratio * (upper!.clientPricePLN - lower!.clientPricePLN)) * 100) / 100;
}

/** SMS remaining = sms_limit + sms_extra_purchased - sms_used */
export function getSmsRemaining(row: {
  sms_limit?: number | null;
  sms_extra_purchased?: number | null;
  sms_used?: number | null;
}): number {
  const limit = row.sms_limit ?? 0;
  const extra = row.sms_extra_purchased ?? 0;
  const used = row.sms_used ?? 0;
  return Math.max(0, limit + extra - used);
}

export function getWaRemaining(row: {
  wa_limit?: number | null;
  wa_extra_purchased?: number | null;
  wa_used?: number | null;
}): number {
  const limit = row.wa_limit ?? 0;
  const extra = row.wa_extra_purchased ?? 0;
  const used = row.wa_used ?? 0;
  return Math.max(0, limit + extra - used);
}

/** Estimate how many minutes business can still handle with their prepaid balance */
export function estimateMinutesFromPrepaid(
  prepaidMinutes: number,
  avgRatePLN: number = 1.05
): number {
  return Math.floor(prepaidMinutes / avgRatePLN);
}

export type SmsServiceStatus = "enabled" | "disabled" | "disabled_by_admin";

export function getSmsServiceStatus(
  businessSettings: {
    sms_enabled?: boolean | null;
    sms_disabled_by_admin?: boolean | null;
  },
  isWitaLine: boolean = false
): SmsServiceStatus {
  if (businessSettings.sms_disabled_by_admin) return "disabled_by_admin";
  if (businessSettings.sms_enabled === false) return "disabled";
  if (isWitaLine) return "enabled";
  return businessSettings.sms_enabled ? "enabled" : "disabled";
}

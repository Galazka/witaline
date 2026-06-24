/**
 * SMS Pricing System — powiązane ze stawkami minut ELASIC_TIERS
 *
 * Ceny BRUTTO (z VAT 23%).
 * Im niższa stawka za minutę, tym więcej wliczonych SMS i niższa cena dodatkowego SMS.
 *
 * Stawki minut (netto):  1.20→1.10→1.00→0.95→0.90→0.85 PLN/min
 * Stawki SMS (netto):    0.50→0.46→0.42→0.40→0.38→0.36 PLN/SMS
 * Darmowe SMS w pakiecie: 20→50→100→200→500→1000
 *
 * Klient kupuje minuty i SMS osobno — salda sumują się.
 */

import { convertPrice, type Currency } from "./pricing";
import { ELASTIC_TIERS } from "./pricing";

export const VAT_RATE = 0.23;
export const VAT_MULTIPLIER = 1 + VAT_RATE;

// ─── Twilio actual cost (NETTO) ───────────────────────────────────
export const TWILIO_SMS_COST_PLN = 0.25;

// ─── SMS price per minute rate (NETTO) ────────────────────────────
// cena dodatkowego SMS jako ułamek stawki minut (około 42% stawki)
export const SMS_PRICE_PER_MIN_RATE_RATIO = 0.42;

// ─── Free SMS per tier (NETTO cena SMS) ───────────────────────────
// wyliczane z: smsPriceNetto = minuteRate * 0.42
// freeSms = round(20 * (1.20 / minuteRate))
export function getSmsPriceNettoForRate(minuteRatePLN: number): number {
  return Math.round(minuteRatePLN * SMS_PRICE_PER_MIN_RATE_RATIO * 100) / 100;
}

export function getFreeSmsForRate(minuteRatePLN: number): number {
  if (minuteRatePLN <= 0) return 0;
  const base = 20 * (1.20 / minuteRatePLN);
  return Math.max(20, Math.round(base / 10) * 10); // zaokrąglenie w górę do 10
}

// ─── SMS prepaid package pricing (BRUTTO) ────────────────────────
// Wyliczane dynamicznie na podstawie domyślnego tieru (1.20 PLN/min netto = 1.476 brutto)
function computeSmsPackages(): SmsPackage[] {
  const baseRate = 1.20; // najwyższa stawka — najdroższy SMS
  const basePriceNetto = getSmsPriceNettoForRate(baseRate); // 0.50
  const baseBrutto = Math.round(basePriceNetto * VAT_MULTIPLIER * 100) / 100;

  return [
    { smsCount: 50,  clientPricePLN: Math.round(baseBrutto * 50 * 100) / 100,  witalineCostPLN: 12.5,  marginPLN: Math.round((baseBrutto * 50 - 12.5) * 100) / 100,  pricePerSmsPLN: baseBrutto },
    { smsCount: 100, clientPricePLN: Math.round(baseBrutto * 100 * 100) / 100, witalineCostPLN: 25,    marginPLN: Math.round((baseBrutto * 100 - 25) * 100) / 100,   pricePerSmsPLN: baseBrutto },
    { smsCount: 200, clientPricePLN: Math.round(baseBrutto * 200 * 100) / 100, witalineCostPLN: 50,    marginPLN: Math.round((baseBrutto * 200 - 50) * 100) / 100,   pricePerSmsPLN: baseBrutto },
    { smsCount: 500, clientPricePLN: Math.round(baseBrutto * 500 * 100) / 100, witalineCostPLN: 125,   marginPLN: Math.round((baseBrutto * 500 - 125) * 100) / 100,  pricePerSmsPLN: baseBrutto },
    { smsCount: 1000, clientPricePLN: Math.round(baseBrutto * 1000 * 100) / 100, witalineCostPLN: 250, marginPLN: Math.round((baseBrutto * 1000 - 250) * 100) / 100, pricePerSmsPLN: baseBrutto },
  ];
}

export const SMS_PACKAGES: SmsPackage[] = computeSmsPackages();

// ─── Types ─────────────────────────────────────────────────────────

export interface SmsPackage {
  smsCount: number;
  clientPricePLN: number; // brutto
  witalineCostPLN: number; // netto
  marginPLN: number; // brutto
  pricePerSmsPLN: number; // brutto
}

export interface SmsPricingConfig {
  witalineCostPerSms: number; // netto
  markupPercent: number;
  clientPricePerSms: number; // brutto
  marginPerSms: number; // brutto
}

export interface SmsCostBreakdown {
  segments: number;
  witalineCostPLN: number; // netto
  clientPricePLN: number; // brutto
  marginPLN: number; // brutto
  marginPercent: number;
}

export function getSmsPricingConfig(
  minuteRatePLN?: number | null,
  businessOverrides?: {
    smsMarkupPercent?: number | null;
    smsBasePriceOverride?: number | null;
  } | null
): SmsPricingConfig {
  const rate = minuteRatePLN ?? ELASTIC_TIERS[0].rate; // domyślnie 1.20
  const basePriceNetto = getSmsPriceNettoForRate(rate);
  const clientPriceBrutto = Math.round(basePriceNetto * VAT_MULTIPLIER * 100) / 100;
  const costToUsBrutto = Math.round(TWILIO_SMS_COST_PLN * VAT_MULTIPLIER * 100) / 100;

  return {
    witalineCostPerSms: TWILIO_SMS_COST_PLN,
    markupPercent: businessOverrides?.smsMarkupPercent ?? Math.round(((clientPriceBrutto / TWILIO_SMS_COST_PLN) - 1) * 100),
    clientPricePerSms: clientPriceBrutto,
    marginPerSms: Math.round((clientPriceBrutto - costToUsBrutto) * 100) / 100,
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
  const sorted = [...SMS_PACKAGES].sort((a, b) => a.smsCount - b.smsCount);
  const lower = sorted.filter((p) => p.smsCount <= smsCount).pop();
  const upper = sorted.find((p) => p.smsCount >= smsCount);
  const baseBrutto = SMS_PACKAGES[0].pricePerSmsPLN;
  if (!lower && !upper) return smsCount * baseBrutto;
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

/** Estimate how many minutes business can still handle */
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

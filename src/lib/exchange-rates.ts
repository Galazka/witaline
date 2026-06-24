/**
 * Exchange rates — fetched from NBP API (Polish National Bank).
 * Cache: 24h in memory (server-side).
 * Fallback: hardcoded rates if NBP is unreachable.
 */

type Rates = {
  usdPln: number;
  eurPln: number;
  plnUsd: number;
  plnEur: number;
  eurUsd: number;
  usdEur: number;
  fetchedAt: string;
};

let cachedRates: Rates | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const FALLBACK_RATES: Rates = {
  usdPln: 4.15,
  eurPln: 4.52,
  plnUsd: 1 / 4.15,
  plnEur: 1 / 4.52,
  eurUsd: 4.52 / 4.15,
  usdEur: 4.15 / 4.52,
  fetchedAt: new Date().toISOString(),
};

export async function getExchangeRates(): Promise<Rates> {
  const now = Date.now();
  if (cachedRates && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRates;
  }

  try {
    const res = await fetch("https://api.nbp.pl/api/exchangerates/tables/A?format=json", {
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        return controller.signal;
      })(),
    });

    if (!res.ok) throw new Error(`NBP responded ${res.status}`);

    const tables: Array<{ rates: Array<{ currency: string; code: string; mid: number }> }> = await res.json();
    const tableA = tables[0];
    if (!tableA) throw new Error("No table A in NBP response");

    const rates: Record<string, number> = {};
    for (const r of tableA.rates) {
      rates[r.code] = r.mid;
    }

    const usdPln = rates.USD || FALLBACK_RATES.usdPln;
    const eurPln = rates.EUR || FALLBACK_RATES.eurPln;

    cachedRates = {
      usdPln,
      eurPln,
      plnUsd: 1 / usdPln,
      plnEur: 1 / eurPln,
      eurUsd: eurPln / usdPln,
      usdEur: usdPln / eurPln,
      fetchedAt: new Date().toISOString(),
    };
    cacheTimestamp = now;
    return cachedRates;
  } catch (err) {
    console.warn("[exchange-rates] NBP fetch failed, using fallback:", (err as Error).message);
    return FALLBACK_RATES;
  }
}

export function convertPln(amountPl: number, toCurrency: "PLN" | "EUR" | "USD", rates?: Rates): number {
  const r = rates || FALLBACK_RATES;
  switch (toCurrency) {
    case "EUR": return Math.round((amountPl / r.eurPln) * 100) / 100;
    case "USD": return Math.round((amountPl / r.usdPln) * 100) / 100;
    default: return Math.round(amountPl * 100) / 100;
  }
}

export function convertToPln(amount: number, fromCurrency: "PLN" | "EUR" | "USD", rates?: Rates): number {
  const r = rates || FALLBACK_RATES;
  switch (fromCurrency) {
    case "EUR": return Math.round((amount * r.eurPln) * 100) / 100;
    case "USD": return Math.round((amount * r.usdPln) * 100) / 100;
    default: return Math.round(amount * 100) / 100;
  }
}

export function formatCurrency(amount: number, currency: "PLN" | "EUR" | "USD", rates?: Rates): string {
  const symbols: Record<string, string> = { PLN: "zł", EUR: "€", USD: "$" };
  const converted = currency === "PLN" ? amount : convertPln(amount, currency, rates);
  const fmt = converted.toFixed(2).replace(".", ",");
  return `${fmt} ${symbols[currency]}`;
}

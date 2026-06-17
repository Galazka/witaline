import Stripe from "stripe";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

function loadEnv(): Record<string, string> {
  const envPath = join(process.cwd(), ".env");
  const content = readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().split("#")[0].trim();
    env[key] = value;
  }
  return env;
}

function updateEnv(key: string, value: string) {
  const envPath = join(process.cwd(), ".env");
  let content = readFileSync(envPath, "utf-8");
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  writeFileSync(envPath, content, "utf-8");
}

const PRODUCTS = [
  {
    name: "WitaLine Self-Service",
    description: "Konfigurator samodzielny — płatność za minutę (0,85 PLN brutto). Elastyczne dodatki: numery, klon głosu, integracje.",
    prices: [
      { label: "base_monthly", amount: 0, currency: "pln", interval: "month", description: "Abonament miesięczny (0 PLN)" },
    ],
  },
  {
    name: "WitaLine Enterprise — Pakiet 500",
    description: "Do 500 minut/miesiąc. Dedykowany onboarding, szkolenie zespołu, priorytetowe wsparcie.",
    prices: [
      { label: "enterprise_500", amount: 49900, currency: "pln", interval: "month", description: "499 PLN brutto/mies" },
    ],
  },
  {
    name: "WitaLine Enterprise — Pakiet 1500",
    description: "500-1500 minut/miesiąc. Dedykowany onboarding, szkolenie zespołu, priorytetowe wsparcie.",
    prices: [
      { label: "enterprise_1500", amount: 149900, currency: "pln", interval: "month", description: "1499 PLN brutto/mies" },
    ],
  },
  {
    name: "WitaLine Enterprise — Pakiet 5000",
    description: "1500-5000 minut/miesiąc. Dedykowany onboarding, konsultacje, SLA 24/7.",
    prices: [
      { label: "enterprise_5000", amount: 399900, currency: "pln", interval: "month", description: "3999 PLN brutto/mies" },
    ],
  },
  {
    name: "WitaLine Enterprise — Pakiet 5000+",
    description: "5000+ minut/miesiąc. Wszystko w cenie + dedykowany opiekun, SLA priorytet.",
    prices: [
      { label: "enterprise_5000plus", amount: 499900, currency: "pln", interval: "month", description: "od 3999+ PLN brutto/mies" },
    ],
  },
  {
    name: "Opłata wdrożeniowa Enterprise",
    description: "Jednorazowa opłata za wdrożenie: onboarding, konfiguracja, szkolenie zespołu.",
    prices: [
      { label: "setup_fee", amount: 29900, currency: "pln", interval: "one_time", description: "299 PLN brutto (jednorazowo)" },
    ],
  },
];

async function main() {
  const env = loadEnv();
  const secretKey = env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey.includes("...")) {
    console.error("Brak STRIPE_SECRET_KEY w .env");
    process.exit(1);
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-05-27.dahlia" });

  console.log("Tworzenie produktów i cen w Stripe...\n");

  const results: Record<string, string> = {};

  for (const product of PRODUCTS) {
    console.log(`Produkt: ${product.name}...`);

    const existingProducts = await stripe.products.list({ active: true, limit: 100 });
    const existing = existingProducts.data.find(p => p.name === product.name);
    let stripeProduct;

    if (existing) {
      stripeProduct = existing;
      console.log(`   Użyto istniejącego: ${existing.id}`);
    } else {
      stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: { model: product.prices[0]?.label || "unknown" },
      });
      console.log(`   Utworzono: ${stripeProduct.id}`);
    }

    for (const price of product.prices) {
      const existingPrices = await stripe.prices.list({ product: stripeProduct.id, active: true, limit: 10 });
      const existingPrice = existingPrices.data.find(
        p => p.unit_amount === price.amount &&
        (price.interval === "one_time" ? !p.recurring : p.recurring?.interval === price.interval)
      );

      if (existingPrice) {
        console.log(`   Cena ${price.label}: ${existingPrice.id} (istnieje)`);
        results[`STRIPE_PRICE_${price.label.toUpperCase()}`] = existingPrice.id;
      } else {
        const priceObj = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: price.amount,
          currency: price.currency as "pln",
          recurring: price.interval === "one_time" ? undefined : { interval: price.interval as "month" },
          metadata: { label: price.label, description: price.description },
        });
        console.log(`   Cena ${price.label}: ${priceObj.id}`);
        results[`STRIPE_PRICE_${price.label.toUpperCase()}`] = priceObj.id;
      }
    }
    console.log();
  }

  console.log("Aktualizacja .env...\n");
  for (const [key, value] of Object.entries(results)) {
    updateEnv(key, value);
    console.log(`   ${key}=${value}`);
  }

  console.log("\nGotowe! Ceny utworzone i dodane do .env");
  console.log("\nNastępne kroki:");
  console.log("   1. Restart serwera: npm run dev");
  console.log("   2. Jeśli webhook nie działa — utwórz go w Stripe Dashboard:");
  console.log("      Endpoint: https://subtle-notify-driven-competitive.trycloudflare.com/api/stripe/webhook");
  console.log("      Zdarzenia: checkout.session.completed, customer.subscription.updated,");
  console.log("                customer.subscription.deleted, invoice.payment_failed");
  console.log("   3. Skopiuj whsec_... do STRIPE_WEBHOOK_SECRET w .env");
}

main().catch((err) => {
  console.error("Blad:", err.message);
  process.exit(1);
});

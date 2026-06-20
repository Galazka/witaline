import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getStripe, PRICE_IDS, ENTERPRISE_PRICE_IDS } from "@/lib/stripe";
import { plans, convertPrice, type Currency } from "@/lib/pricing";

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

const SUPPORTED_CURRENCIES: Currency[] = ["pln", "eur", "usd"];

function stripeLocale(currency: Currency): "pl" | "en" {
  return currency === "pln" ? "pl" : "en";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, businessId, enterpriseTier, currency = "pln" } = await request.json();
  const cur: Currency = SUPPORTED_CURRENCIES.includes(currency) ? currency : "pln";

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const customerId = business.stripe_customer_id || undefined;
  const stripe = getStripe();

  const paymentTypes: Array<"card" | "blik" | "p24"> = cur === "pln"
    ? ["card", "blik", "p24"]
    : ["card"];

  // Enterprise — multiple line items (subscription + setup fee)
  if (plan === "enterprise" && enterpriseTier) {
    const priceId = ENTERPRISE_PRICE_IDS[enterpriseTier];
    if (!priceId) return NextResponse.json({ error: "Invalid enterprise tier" }, { status: 400 });

    const setupFeePriceId = process.env.STRIPE_PRICE_SETUP_FEE;
    const lineItems: Array<{ price: string; quantity: number }> = [
      { price: priceId, quantity: 1 },
    ];
    if (setupFeePriceId) {
      lineItems.push({ price: setupFeePriceId, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: paymentTypes,
      line_items: lineItems,
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: businessId,
      metadata: { businessId, userId: user.id, plan, enterpriseTier, currency: cur },
      success_url: `${BASE_URL}/dashboard?payment=success`,
      cancel_url: `${BASE_URL}/dashboard?payment=cancel`,
      locale: stripeLocale(cur),
    });

    return NextResponse.json({ url: session.url });
  }

  // Dynamic pricing for all plans — multi-currency
  const planConfig = plans[plan];
  if (!planConfig) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const pricePLN = planConfig.price;
  const priceInCurrency = convertPrice(pricePLN, cur);
  const unitAmount = Math.round(priceInCurrency * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: paymentTypes,
    line_items: [{
      price_data: {
        currency: cur,
        product_data: {
          name: `WitaLine ${planConfig.label}`,
          description: `${planConfig.minutes} minut/mies + funkcje premium`,
        },
        unit_amount: unitAmount,
        recurring: { interval: "month" as const },
      },
      quantity: 1,
    }],
    customer: customerId,
    customer_email: customerId ? undefined : user.email,
    client_reference_id: businessId,
    metadata: {
      businessId,
      userId: user.id,
      plan,
      currency: cur,
      price_pln: String(pricePLN),
    },
    success_url: `${BASE_URL}/dashboard?payment=success`,
    cancel_url: `${BASE_URL}/dashboard?payment=cancel`,
    locale: stripeLocale(cur),
  });

  return NextResponse.json({ url: session.url });
}





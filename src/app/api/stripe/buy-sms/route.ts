import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { convertPrice, type Currency } from "@/lib/pricing";
import { SMS_PACKAGES, getSmsPackagePrice } from "@/lib/sms-pricing";

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

const SUPPORTED_CURRENCIES: Currency[] = ["pln", "eur", "usd"];

function stripeLocale(currency: Currency): "pl" | "en" {
  return currency === "pln" ? "pl" : "en";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, smsCount, currency = "pln" } = await request.json();
  const cur: Currency = SUPPORTED_CURRENCIES.includes(currency) ? currency : "pln";
  const count = parseInt(smsCount, 10);
  if (!businessId || !count || count < 1) {
    return NextResponse.json({ error: "Invalid SMS count" }, { status: 400 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, stripe_customer_id")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pricePLN = getSmsPackagePrice(count);
  const priceInCurrency = convertPrice(pricePLN, cur);
  const amountCents = Math.round(priceInCurrency * 100);

  const stripe = getStripe();

  const paymentTypes: Array<"card" | "blik" | "p24"> = cur === "pln"
    ? ["card", "blik", "p24"]
    : ["card"];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: paymentTypes,
    line_items: [{
      price_data: {
        currency: cur,
        product_data: {
          name: cur === "pln" ? `Pakiet ${count} SMS` : `SMS Pack ${count}`,
          description: cur === "pln"
            ? `${count} wiadomości SMS – ${pricePLN.toFixed(2).replace(".", ",")} PLN`
            : `${count} SMS messages – ${priceInCurrency.toFixed(2).replace(".", ",")} ${cur.toUpperCase()}`,
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    }],
    customer: business.stripe_customer_id || undefined,
    customer_email: business.stripe_customer_id ? undefined : user.email,
    client_reference_id: businessId,
    metadata: {
      businessId,
      userId: user.id,
      type: "sms_package",
      sms_count: String(count),
      currency: cur,
      amount_pln: String(pricePLN),
    },
    success_url: `${BASE_URL}/dashboard?payment=success`,
    cancel_url: `${BASE_URL}/dashboard?payment=cancel`,
    locale: stripeLocale(cur),
  });

  if (session.url) {
    await supabase
      .from("businesses")
      .update({ stripe_customer_id: session.customer as string || business.stripe_customer_id })
      .eq("id", businessId);
  }

  return NextResponse.json({ url: session.url });
}

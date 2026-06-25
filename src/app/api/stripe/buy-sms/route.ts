import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { convertPrice, type Currency } from "@/lib/pricing";
import { getSmsPackagePrice } from "@/lib/sms-pricing";

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

function stripeLocale(currency: Currency): "pl" | "en" {
  return currency === "pln" ? "pl" : "en";
}

const buySmsSchema = z.object({
  businessId: z.string().uuid(),
  smsCount: z.number().int().min(1),
  currency: z.enum(["pln", "eur", "usd"]).optional().default("pln"),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await request.json();
  const parsed = buySmsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => `${i.path}: ${i.message}`).join("; ") }, { status: 400 });
  }

  const { businessId, smsCount, currency } = parsed.data;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, stripe_customer_id")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pricePLN = getSmsPackagePrice(smsCount);
  const priceInCurrency = convertPrice(pricePLN, currency);
  const amountCents = Math.round(priceInCurrency * 100);

  const stripe = getStripe();

  const paymentTypes: Array<"card" | "blik" | "p24"> = currency === "pln"
    ? ["card", "blik", "p24"]
    : ["card"];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: paymentTypes,
    line_items: [{
      price_data: {
        currency,
        product_data: {
          name: currency === "pln" ? `Pakiet ${smsCount} SMS brutto` : `SMS Pack ${smsCount}`,
          description: currency === "pln"
            ? `${smsCount} wiadomości SMS – ${pricePLN.toFixed(2).replace(".", ",")} PLN brutto`
            : `${smsCount} SMS messages – ${priceInCurrency.toFixed(2).replace(".", ",")} ${currency.toUpperCase()}`,
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
      sms_count: String(smsCount),
      currency,
      amount_brutto_pln: String(pricePLN),
    },
    success_url: `${BASE_URL}/dashboard?payment=success`,
    cancel_url: `${BASE_URL}/dashboard?payment=cancel`,
    locale: stripeLocale(currency),
  });

  if (session.url) {
    await supabase
      .from("businesses")
      .update({ stripe_customer_id: session.customer as string || business.stripe_customer_id })
      .eq("id", businessId);
  }

  return NextResponse.json({ url: session.url });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { getElasticRate, convertPrice, type Currency } from "@/lib/pricing";

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

function stripeLocale(currency: Currency): "pl" | "en" {
  return currency === "pln" ? "pl" : "en";
}

const buyMinutesSchema = z.object({
  businessId: z.string().uuid(),
  minutes: z.number().int().min(50).max(5000),
  currency: z.enum(["pln", "eur", "usd"]).optional().default("pln"),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await request.json();
  const parsed = buyMinutesSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => `${i.path}: ${i.message}`).join("; ") }, { status: 400 });
  }

  const { businessId, minutes, currency } = parsed.data;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, stripe_customer_id")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ratePLN = getElasticRate(minutes);
  const amountNettoPLN = minutes * ratePLN;
  const amountBruttoPLN = Math.round(amountNettoPLN * 1.23 * 100) / 100;
  const amountInCurrency = convertPrice(amountBruttoPLN, currency);
  const amountCents = Math.round(amountInCurrency * 100);
  const rateDisplay = convertPrice(ratePLN, currency).toFixed(2).replace(".", ",");

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
          name: `Pakiet ${minutes} minut brutto`,
          description: `Pakiet rozmów AI — ${minutes} min × ${rateDisplay} ${currency.toUpperCase()}/min + 23% VAT`,
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
      type: "minute_package",
      minutes: String(minutes),
      rate: String(ratePLN),
      currency,
      amount_netto_pln: String(amountNettoPLN),
      amount_brutto_pln: String(amountBruttoPLN),
    },
    success_url: `${BASE_URL}/dashboard?payment=success`,
    cancel_url: `${BASE_URL}/dashboard?payment=cancel`,
    locale: stripeLocale(currency),
  });

  if (session.url) {
    const { error: updateErr } = await supabase
      .from("businesses")
      .update({ stripe_customer_id: session.customer as string || business.stripe_customer_id })
      .eq("id", businessId);
    if (updateErr) console.error("[buy-minutes] save customer id error:", updateErr);
  }

  return NextResponse.json({ url: session.url });
}

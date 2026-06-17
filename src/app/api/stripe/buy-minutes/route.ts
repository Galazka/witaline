import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { getElasticRate } from "@/lib/pricing";

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, minutes } = await request.json();
  const mins = parseInt(minutes, 10);
  if (!businessId || !mins || mins < 50 || mins > 5000) {
    return NextResponse.json({ error: "Invalid minutes (50-5000)" }, { status: 400 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, stripe_customer_id")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rate = getElasticRate(mins);
  const amountNetto = Math.round(mins * rate * 100);
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "blik", "p24"],
    line_items: [{
      price_data: {
        currency: "pln",
        product_data: {
          name: `Pakiet ${mins} minut`,
          description: `Pakiet rozmów AI — ${mins} min × ${rate.toFixed(2).replace(".", ",")} PLN/min`,
        },
        unit_amount: amountNetto,
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
      minutes: String(mins),
      rate: String(rate),
    },
    success_url: `${BASE_URL}/dashboard?payment=success`,
    cancel_url: `${BASE_URL}/dashboard?payment=cancel`,
    locale: "pl",
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

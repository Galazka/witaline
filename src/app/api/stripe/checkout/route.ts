import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getStripe, PRICE_IDS, ENTERPRISE_PRICE_IDS } from "@/lib/stripe";

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, businessId, enterpriseTier } = await request.json();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const customerId = business.stripe_customer_id || undefined;
  const stripe = getStripe();

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
      payment_method_types: ["card", "blik", "p24"],
      line_items: lineItems,
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: businessId,
      metadata: { businessId, userId: user.id, plan, enterpriseTier },
      success_url: `${BASE_URL}/dashboard?payment=success`,
      cancel_url: `${BASE_URL}/dashboard?payment=cancel`,
      locale: "pl",
    });

    return NextResponse.json({ url: session.url });
  }

  // Self-service or legacy plan
  if (!PRICE_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card", "blik", "p24"],
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    customer: customerId,
    customer_email: customerId ? undefined : user.email,
    client_reference_id: businessId,
    metadata: { businessId, userId: user.id, plan },
    success_url: `${BASE_URL}/dashboard?payment=success`,
    cancel_url: `${BASE_URL}/dashboard?payment=cancel`,
    locale: "pl",
  });

  return NextResponse.json({ url: session.url });
}





import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, stripe_customer_id")
    .eq("owner_uid", user.id)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const stripe = getStripe();

  // Create or retrieve Stripe customer
  let customerId = business.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { businessId: business.id },
    });
    customerId = customer.id;
    await supabase.from("businesses").update({ stripe_customer_id: customerId }).eq("id", business.id);
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    metadata: { businessId: business.id },
  });

  return NextResponse.json({ clientSecret: setupIntent.client_secret, customerId });
}

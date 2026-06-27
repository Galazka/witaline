import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");

  const { data: business } = await supabase
    .from("businesses")
    .select("stripe_customer_id")
    .eq("id", businessId)
    .single();

  if (!business?.stripe_customer_id) {
    return NextResponse.json({ error: "No customer ID" }, { status: 404 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: business.stripe_customer_id,
    return_url: `${BASE_URL}/dashboard?tab=billing`,
    locale: "pl",
  });

  return NextResponse.redirect(session.url);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = await request.json();

  const { data: business } = await supabase
    .from("businesses")
    .select("stripe_customer_id")
    .eq("id", businessId)
    .single();

  if (!business?.stripe_customer_id) {
    return NextResponse.json({ error: "No customer ID" }, { status: 404 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: business.stripe_customer_id,
    return_url: `${BASE_URL}/dashboard?tab=billing`,
    locale: "pl",
  });

  return NextResponse.json({ url: session.url });
}





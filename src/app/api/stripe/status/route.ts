import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const { data: business } = await supabase
    .from("businesses")
    .select("subscription_status, trial_ends_at, suspended, stripe_customer_id")
    .eq("id", businessId)
    .single();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    status: business.subscription_status,
    trialEndsAt: business.trial_ends_at,
    suspended: business.suspended,
    hasCustomerId: !!business.stripe_customer_id,
  });
}





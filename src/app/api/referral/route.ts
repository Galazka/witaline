import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET: Get current business referral info
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, referral_code, referred_by, prepaid_minutes, name")
    .eq("owner_uid", user.id)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: refs } = await supabaseAdmin
    .from("referrals")
    .select("id, status, referrer_minutes_granted, referred_minutes_granted, created_at, referred_business:referred_business_id(name)")
    .eq("referrer_business_id", business.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    code: business.referral_code,
    referralLink: `${process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl"}/register?ref=${business.referral_code}`,
    referredBy: business.referred_by,
    referrals: refs || [],
    businessName: business.name,
  });
}

// POST: Validate a referral code during registration
export async function POST(request: Request) {
  const body = await request.json();
  const { code } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Brak kodu polecenia" }, { status: 400 });
  }

  const { data: referrer } = await supabaseAdmin
    .from("businesses")
    .select("id, name, referral_code, prepaid_minutes")
    .eq("referral_code", code.trim().toLowerCase())
    .maybeSingle();

  if (!referrer) {
    return NextResponse.json({ error: "Nieprawidłowy kod polecenia" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, referrerName: referrer.name, referrerId: referrer.id });
}

// POST: Grant referral bonus (called after successful new business registration with referral)
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { referred_business_id } = body;

  if (!referred_business_id) {
    return NextResponse.json({ error: "Missing referred_business_id" }, { status: 400 });
  }

  const { data: newBiz } = await supabaseAdmin
    .from("businesses")
    .select("id, referral_code, owner_uid, prepaid_minutes")
    .eq("id", referred_business_id)
    .single();

  if (!newBiz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { data: referrer } = await supabaseAdmin
    .from("businesses")
    .select("id, prepaid_minutes")
    .eq("referral_code", newBiz.referred_by)
    .maybeSingle();

  if (!referrer) return NextResponse.json({ error: "Referrer not found" }, { status: 404 });

  const BONUS_MINUTES = 100;

  const { error: refErr } = await supabaseAdmin
    .from("referrals")
    .upsert({
      referrer_business_id: referrer.id,
      referred_business_id: newBiz.id,
      status: "completed",
      referrer_minutes_granted: BONUS_MINUTES,
      referred_minutes_granted: BONUS_MINUTES,
    }, { onConflict: "referrer_business_id,referred_business_id" });

  if (refErr) return NextResponse.json({ error: refErr.message }, { status: 500 });

  await supabaseAdmin.from("businesses")
    .update({ prepaid_minutes: (referrer.prepaid_minutes || 0) + BONUS_MINUTES })
    .eq("id", referrer.id);

  await supabaseAdmin.from("businesses")
    .update({ prepaid_minutes: (newBiz.prepaid_minutes || 0) + BONUS_MINUTES })
    .eq("id", newBiz.id);

  return NextResponse.json({ ok: true, bonusMinutes: BONUS_MINUTES });
}

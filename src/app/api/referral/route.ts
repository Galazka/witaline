import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DISCOUNT_PERCENT = 20;
const COUPON_TTL_DAYS = 90;

// GET: current business referral info + coupons
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, referral_code, referred_by, name")
    .eq("owner_uid", user.id)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: refs } = await supabaseAdmin
    .from("referrals")
    .select("id, status, created_at, referred_business:referred_business_id(name)")
    .eq("referrer_business_id", business.id)
    .order("created_at", { ascending: false });

  const { data: myCoupons } = await supabaseAdmin
    .from("referral_coupons")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    code: business.referral_code,
    referralLink: `${process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl"}/register?ref=${business.referral_code}`,
    referredBy: business.referred_by,
    referrals: refs || [],
    coupons: myCoupons || [],
    businessName: business.name,
  });
}

// POST: validate referral code + create coupon pair
export async function POST(request: Request) {
  const body = await request.json();
  const { code } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Brak kodu polecenia" }, { status: 400 });
  }

  const { data: referrer } = await supabaseAdmin
    .from("businesses")
    .select("id, name, referral_code")
    .eq("referral_code", code.trim().toLowerCase())
    .maybeSingle();

  if (!referrer) {
    return NextResponse.json({ error: "Nieprawidłowy kod polecenia" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, referrerName: referrer.name, referrerId: referrer.id });
}

// PUT: create discount coupons after successful registration with referral
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { referred_business_id, referrer_id } = body;

  if (!referred_business_id || !referrer_id) {
    return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
  }

  const { data: newBiz } = await supabaseAdmin
    .from("businesses")
    .select("id, referral_code")
    .eq("id", referred_business_id)
    .single();

  if (!newBiz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const referrerCouponCode = `REF-${newBiz.referral_code?.toUpperCase() || "X"}-A`;
  const referredCouponCode = `REF-${newBiz.referral_code?.toUpperCase() || "X"}-B`;

  const expiresAt = new Date(Date.now() + COUPON_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: refErr } = await supabaseAdmin
    .from("referrals")
    .upsert({
      referrer_business_id: referrer_id,
      referred_business_id: newBiz.id,
      status: "completed",
    }, { onConflict: "referrer_business_id,referred_business_id" });

  if (refErr) return NextResponse.json({ error: refErr.message }, { status: 500 });

  const { error: coupErr } = await supabaseAdmin.from("referral_coupons").insert([
    {
      code: referrerCouponCode,
      business_id: referrer_id,
      discount_percent: DISCOUNT_PERCENT,
    },
    {
      code: referredCouponCode,
      business_id: newBiz.id,
      discount_percent: DISCOUNT_PERCENT,
    },
  ]);

  if (coupErr) return NextResponse.json({ error: coupErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    discountPercent: DISCOUNT_PERCENT,
    referrerCoupon: referrerCouponCode,
    referredCoupon: referredCouponCode,
  });
}

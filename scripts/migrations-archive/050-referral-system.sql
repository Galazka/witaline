CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_business_id UUID NOT NULL REFERENCES businesses(id),
  referred_business_id UUID NOT NULL REFERENCES businesses(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id),
  discount_percent INTEGER NOT NULL DEFAULT 20,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_business_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_coupons_business ON referral_coupons(business_id);
CREATE INDEX IF NOT EXISTS idx_referral_coupons_code ON referral_coupons(code);

-- Add referral_code column first (if missing)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Then generate codes for existing rows
UPDATE businesses
SET referral_code = LOWER(SUBSTRING(MD5(random()::text || id::text), 1, 8))
WHERE referral_code IS NULL OR referral_code = '';

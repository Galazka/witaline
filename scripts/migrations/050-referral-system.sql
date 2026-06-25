CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_business_id UUID NOT NULL REFERENCES businesses(id),
  referred_business_id UUID NOT NULL REFERENCES businesses(id),
  referrer_minutes_granted DECIMAL(10,2) DEFAULT 100,
  referred_minutes_granted DECIMAL(10,2) DEFAULT 100,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referrer_business_id, referred_business_id)
);

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES businesses(id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_business_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Generate referral codes for existing businesses (if none)
UPDATE businesses
SET referral_code = LOWER(SUBSTRING(MD5(random()::text || id::text), 1, 8))
WHERE referral_code IS NULL;

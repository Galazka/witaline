-- ============================================================
-- 013 — Balance system: prepaid accounts & number purchase
-- Run in Supabase SQL Editor
-- ============================================================

-- Add balance columns to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS balance NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Phone number purchase log
CREATE TABLE IF NOT EXISTS number_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  cost_pln NUMERIC(10,2) NOT NULL,
  twilio_sid TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Balance top-up log
CREATE TABLE IF NOT EXISTS balance_topups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  amount_pln NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Set initial balance for all existing businesses (welcome bonus)
UPDATE businesses SET balance = 50 WHERE balance = 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_number_purchases_business ON number_purchases(business_id);
CREATE INDEX IF NOT EXISTS idx_balance_topups_business ON balance_topups(business_id);

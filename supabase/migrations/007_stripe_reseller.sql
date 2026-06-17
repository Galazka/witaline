-- Stripe subscriptions + reseller + recordings

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing'
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT now() + interval '14 days';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES auth.users;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS reseller_markup DECIMAL(5,2) DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE;

-- Recordings URL on call_logs
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS recording_url TEXT DEFAULT '';

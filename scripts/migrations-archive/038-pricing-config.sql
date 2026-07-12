-- 038: Pricing configuration table + business overrides

CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_pricing_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
  overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default config
INSERT INTO pricing_config (name, is_active, config) VALUES
('Domyślna (czerwiec 2026)', true, '{
  "internalCostPerMin": 0.65,
  "elasticBaseRate": 2.00,
  "elasticStepDecrease": 0.10,
  "elasticMinRate": 1.00,
  "elasticTierStep": 500,
  "elasticStartMin": 50,
  "elasticMaxMin": 5000,
  "planStart": 299,
  "planGrowth": 600,
  "planPro": 300,
  "planLux": 800,
  "planEnterprise": 1500,
  "addonOwnNumber": 49,
  "addonGoogleCalendar": 39,
  "addonCrm": 79,
  "addonVoiceClone": 99,
  "addonUnlimitedConsultants": 149,
  "addonPrioritySupport": 59,
  "addonSla247": 199,
  "enterpriseSetupFee": 299,
  "enterpriseMinMonthly": 1500,
  "minMarginPercent": 35,
  "overageMultiplier": 1.0
}'::jsonb)
ON CONFLICT DO NOTHING;

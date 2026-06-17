-- WitaLine - Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Leads: onboarding submissions from potential clients
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  nip TEXT NOT NULL,
  industry TEXT,
  knowledge_base_raw TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processed', 'active')),
  contact_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Businesses: active client profiles
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_uid UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  twilio_number TEXT,
  current_plan TEXT NOT NULL DEFAULT 'start_100' CHECK (current_plan IN ('start_100', 'pro_500', 'enterprise_2000')),
  minutes_used_this_week INTEGER DEFAULT 0,
  system_prompt TEXT,
  menu_catalog JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Call logs: individual call records
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  duration_seconds INTEGER NOT NULL,
  cost_pln NUMERIC(10,2) NOT NULL,
  caller_id TEXT,
  transcript TEXT DEFAULT '',
  classification TEXT NOT NULL CHECK (classification IN ('order', 'inquiry')),
  ai_summary TEXT DEFAULT '',
  was_helpful BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for dashboard queries
CREATE INDEX idx_call_logs_business_id ON call_logs(business_id);
CREATE INDEX idx_call_logs_classification ON call_logs(classification);
CREATE INDEX idx_call_logs_created_at ON call_logs(created_at DESC);
CREATE INDEX idx_businesses_owner_uid ON businesses(owner_uid);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Businesses: owner can only see their own business
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY businesses_select_own ON businesses
  FOR SELECT
  USING (owner_uid = auth.uid());

CREATE POLICY businesses_update_own ON businesses
  FOR UPDATE
  USING (owner_uid = auth.uid());

CREATE POLICY businesses_insert_own ON businesses
  FOR INSERT
  WITH CHECK (owner_uid = auth.uid());

-- Call logs: owner can see logs for their businesses
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY call_logs_select_own ON call_logs
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_uid = auth.uid()
    )
  );

-- Leads: only admins (service_role) can manage leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_admin_all ON leads
  USING (auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

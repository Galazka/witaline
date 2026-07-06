-- ============================================================
-- WitaLine — Full Database Migration (001-010 combined)
-- Run this entire file in Supabase SQL Editor in ONE go.
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 001 — Initial Schema (leads, businesses, call_logs)
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  nip TEXT NOT NULL,
  industry TEXT,
  knowledge_base_raw TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processed', 'active')),
  contact_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS businesses (
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

CREATE TABLE IF NOT EXISTS call_logs (
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

CREATE INDEX IF NOT EXISTS idx_call_logs_business_id ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_classification ON call_logs(classification);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_uid ON businesses(owner_uid);

-- RLS — Businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS businesses_select_own ON businesses;
CREATE POLICY businesses_select_own ON businesses FOR SELECT USING (owner_uid = auth.uid());
DROP POLICY IF EXISTS businesses_update_own ON businesses;
CREATE POLICY businesses_update_own ON businesses FOR UPDATE USING (owner_uid = auth.uid());
DROP POLICY IF EXISTS businesses_insert_own ON businesses;
CREATE POLICY businesses_insert_own ON businesses FOR INSERT WITH CHECK (owner_uid = auth.uid());

-- RLS — Call logs
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS call_logs_select_own ON call_logs;
CREATE POLICY call_logs_select_own ON call_logs FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

-- RLS — Leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leads_admin_all ON leads;
CREATE POLICY leads_admin_all ON leads USING (auth.role() = 'service_role');

-- Function: auto-update timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- 002 — Cron: weekly minute reset
-- ============================================================

CREATE OR REPLACE FUNCTION reset_weekly_minutes()
RETURNS void AS $$
BEGIN
  UPDATE businesses SET minutes_used_this_week = 0;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule(
  'reset-weekly-minutes',
  '0 23 * * 1',
  'SELECT reset_weekly_minutes();'
);

-- ============================================================
-- 003 — Reservations & Feedback
-- ============================================================

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  call_log_id UUID REFERENCES call_logs ON DELETE SET NULL,
  caller_name TEXT NOT NULL DEFAULT '',
  caller_phone TEXT NOT NULL DEFAULT '',
  service_type TEXT NOT NULL DEFAULT '',
  reserved_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_business_id ON reservations(business_id);
CREATE INDEX IF NOT EXISTS idx_reservations_reserved_at ON reservations(reserved_at);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reservations_select_own ON reservations;
CREATE POLICY reservations_select_own ON reservations FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS reservations_insert_own ON reservations;
CREATE POLICY reservations_insert_own ON reservations FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS reservations_update_own ON reservations;
CREATE POLICY reservations_update_own ON reservations FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS reservations_delete_own ON reservations;
CREATE POLICY reservations_delete_own ON reservations FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  call_log_id UUID REFERENCES call_logs ON DELETE SET NULL,
  caller_phone TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  category TEXT DEFAULT 'general'
    CHECK (category IN ('general', 'service', 'booking', 'support', 'complaint')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_business_id ON feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feedback_select_own ON feedback;
CREATE POLICY feedback_select_own ON feedback FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS feedback_insert_service ON feedback;
CREATE POLICY feedback_insert_service ON feedback FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS update_reservations_modtime ON reservations;
CREATE TRIGGER update_reservations_modtime
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 004 — Calendar tokens (Google Calendar integration)
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL DEFAULT '',
  refresh_token TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ,
  calendar_email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_tokens_business ON calendar_tokens(business_id);

ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calendar_tokens_select_own ON calendar_tokens;
CREATE POLICY calendar_tokens_select_own ON calendar_tokens FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS calendar_tokens_insert_own ON calendar_tokens;
CREATE POLICY calendar_tokens_insert_own ON calendar_tokens FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS calendar_tokens_update_own ON calendar_tokens;
CREATE POLICY calendar_tokens_update_own ON calendar_tokens FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

DROP TRIGGER IF EXISTS update_calendar_tokens_modtime ON calendar_tokens;
CREATE TRIGGER update_calendar_tokens_modtime
  BEFORE UPDATE ON calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 005 — Built-in Calendar & Services (ALTER existing tables)
-- ============================================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS calendar_settings JSONB DEFAULT '{
  "monday": {"enabled": true, "start": "09:00", "end": "17:00"},
  "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"},
  "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"},
  "thursday": {"enabled": true, "start": "09:00", "end": "17:00"},
  "friday": {"enabled": true, "start": "09:00", "end": "17:00"},
  "saturday": {"enabled": false, "start": "10:00", "end": "14:00"},
  "sunday": {"enabled": false, "start": "00:00", "end": "00:00"},
  "buffer_minutes": 15,
  "slot_interval": 30
}';

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS service_id UUID;

-- ============================================================
-- 006 — Reservation change workflow
-- ============================================================

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS change_token TEXT DEFAULT '';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS pending_changes JSONB DEFAULT NULL;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS caller_notified BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 007 — Stripe subscriptions + reseller + recordings
-- ============================================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing'
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT now() + interval '14 days';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES auth.users;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS reseller_markup DECIMAL(5,2) DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_url TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS recording_url TEXT DEFAULT '';

-- ============================================================
-- 008 — Coupons & Discounts
-- ============================================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  discount_percent DECIMAL(5,2) CHECK (discount_percent > 0 AND discount_percent <= 100),
  discount_amount DECIMAL(10,2) CHECK (discount_amount > 0),
  max_uses INTEGER DEFAULT 0,   -- 0 = unlimited
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,       -- NULL = no expiry
  applicable_plans TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now(),
  original_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  discount_percent DECIMAL(5,2) CHECK (discount_percent > 0 AND discount_percent <= 100),
  discount_amount DECIMAL(10,2) CHECK (discount_amount > 0),
  target_plans TEXT[] DEFAULT '{}',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  max_uses_total INTEGER DEFAULT 0,  -- 0 = unlimited
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_coupon_usages_business ON coupon_usages(business_id);
CREATE INDEX IF NOT EXISTS idx_discount_rules_active ON discount_rules(active, start_at, end_at);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS coupons_admin_all ON coupons;
CREATE POLICY coupons_admin_all ON coupons USING (auth.role() = 'service_role');

ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS coupon_usages_admin_all ON coupon_usages;
CREATE POLICY coupon_usages_admin_all ON coupon_usages USING (auth.role() = 'service_role');

ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS discount_rules_admin_all ON discount_rules;
CREATE POLICY discount_rules_admin_all ON discount_rules USING (auth.role() = 'service_role');

-- Insert welcome coupon
INSERT INTO coupons (code, description, discount_percent, max_uses, applicable_plans, valid_until)
VALUES ('WITAJ50', '50% zniżki na pierwszy miesiąc', 50, 100, '{}', now() + interval '90 days')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 009 — Coupon RPC functions
-- ============================================================

CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_discount_rule_usage(rule_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE discount_rules SET used_count = used_count + 1 WHERE id = rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 010 — Conversations, Messages, Transcriptions, Knowledge, Dashboard Configs
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'voice', 'sms', 'widget')),
  caller_id TEXT,
  caller_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
  summary TEXT DEFAULT '',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  tags TEXT[] DEFAULT '{}',
  duration_seconds INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations ON DELETE SET NULL,
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  call_log_id UUID REFERENCES call_logs ON DELETE SET NULL,
  audio_url TEXT,
  transcript TEXT NOT NULL,
  language TEXT DEFAULT 'pl',
  duration_seconds INTEGER,
  speaker TEXT DEFAULT 'unknown' CHECK (speaker IN ('caller', 'assistant', 'unknown')),
  confidence NUMERIC(3,2),
  summary TEXT DEFAULT '',
  key_phrases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'general', 'services', 'pricing', 'hours', 'location', 'faq',
    'products', 'policies', 'team', 'promotions', 'custom'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL UNIQUE,
  layout JSONB DEFAULT '{
    "widgets": [
      {"id": "stats", "type": "stats", "enabled": true, "order": 0},
      {"id": "recent_chats", "type": "chats", "enabled": true, "order": 1},
      {"id": "calls", "type": "calls", "enabled": true, "order": 2},
      {"id": "reservations", "type": "reservations", "enabled": true, "order": 3}
    ]
  }',
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_business_id ON conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_business_id ON messages(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcriptions_business_id ON transcriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_conversation_id ON transcriptions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_knowledge_business_id ON business_knowledge(business_id);
CREATE INDEX IF NOT EXISTS idx_business_knowledge_category ON business_knowledge(category);

-- RLS — Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conversations_select_own ON conversations;
CREATE POLICY conversations_select_own ON conversations FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS conversations_insert_own ON conversations;
CREATE POLICY conversations_insert_own ON conversations FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS conversations_update_own ON conversations;
CREATE POLICY conversations_update_own ON conversations FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

-- RLS — Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_select_own ON messages;
CREATE POLICY messages_select_own ON messages FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS messages_insert_own ON messages;
CREATE POLICY messages_insert_own ON messages FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

-- RLS — Transcriptions
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS transcriptions_select_own ON transcriptions;
CREATE POLICY transcriptions_select_own ON transcriptions FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS transcriptions_insert_own ON transcriptions;
CREATE POLICY transcriptions_insert_own ON transcriptions FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

-- RLS — Business Knowledge
ALTER TABLE business_knowledge ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS business_knowledge_select_own ON business_knowledge;
CREATE POLICY business_knowledge_select_own ON business_knowledge FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS business_knowledge_insert_own ON business_knowledge;
CREATE POLICY business_knowledge_insert_own ON business_knowledge FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS business_knowledge_update_own ON business_knowledge;
CREATE POLICY business_knowledge_update_own ON business_knowledge FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS business_knowledge_delete_own ON business_knowledge;
CREATE POLICY business_knowledge_delete_own ON business_knowledge FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

-- RLS — Dashboard Configs
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dashboard_configs_select_own ON dashboard_configs;
CREATE POLICY dashboard_configs_select_own ON dashboard_configs FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS dashboard_configs_insert_own ON dashboard_configs;
CREATE POLICY dashboard_configs_insert_own ON dashboard_configs FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS dashboard_configs_update_own ON dashboard_configs;
CREATE POLICY dashboard_configs_update_own ON dashboard_configs FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

-- Admin policies (service_role — used by server-side API routes)
DROP POLICY IF EXISTS businesses_admin_all ON businesses;
CREATE POLICY businesses_admin_all ON businesses USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS call_logs_admin_all ON call_logs;
CREATE POLICY call_logs_admin_all ON call_logs USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS conversations_admin_all ON conversations;
CREATE POLICY conversations_admin_all ON conversations USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS messages_admin_all ON messages;
CREATE POLICY messages_admin_all ON messages USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS transcriptions_admin_all ON transcriptions;
CREATE POLICY transcriptions_admin_all ON transcriptions USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS business_knowledge_admin_all ON business_knowledge;
CREATE POLICY business_knowledge_admin_all ON business_knowledge USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS dashboard_configs_admin_all ON dashboard_configs;
CREATE POLICY dashboard_configs_admin_all ON dashboard_configs USING (auth.role() = 'service_role');

-- ============================================================
-- DONE — all 10 migrations combined
-- ============================================================
SELECT 'WitaLine schema ready' AS status;

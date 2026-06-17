-- ============================================================
-- WitaLine — Complete Database Schema
-- Combined from all migration files
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 001 — Leads
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

-- ============================================================
-- 001 — Businesses
-- ============================================================
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

-- ============================================================
-- 001 — Call logs
-- ============================================================
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

-- ============================================================
-- scripts/migration-contact-messages.sql
-- contact_messages table
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  website TEXT,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 003 — Reservations
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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 003 — Feedback
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  call_log_id UUID REFERENCES call_logs ON DELETE SET NULL,
  caller_phone TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'service', 'booking', 'support', 'complaint')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 004 — Calendar tokens
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

-- ============================================================
-- 008 — Coupons
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  discount_percent DECIMAL(5,2) CHECK (discount_percent > 0 AND discount_percent <= 100),
  discount_amount DECIMAL(10,2) CHECK (discount_amount > 0),
  max_uses INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  applicable_plans TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 008 — Coupon usages
-- ============================================================
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now(),
  original_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- 008 — Discount rules
-- ============================================================
CREATE TABLE IF NOT EXISTS discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  discount_percent DECIMAL(5,2) CHECK (discount_percent > 0 AND discount_percent <= 100),
  discount_amount DECIMAL(10,2) CHECK (discount_amount > 0),
  target_plans TEXT[] DEFAULT '{}',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  max_uses_total INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 010 — Conversations
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

-- ============================================================
-- 010 — Messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 010 — Transcriptions
-- ============================================================
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

-- ============================================================
-- 010 — Business knowledge
-- ============================================================
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

-- ============================================================
-- 010 — Dashboard configs
-- ============================================================
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL UNIQUE,
  layout JSONB DEFAULT '{"widgets": [{"id": "stats", "type": "stats", "enabled": true, "order": 0}, {"id": "recent_chats", "type": "chats", "enabled": true, "order": 1}, {"id": "calls", "type": "calls", "enabled": true, "order": 2}, {"id": "reservations", "type": "reservations", "enabled": true, "order": 3}]}',
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- scripts/migration-ivr.sql
-- callback_requests table
-- ============================================================
CREATE TABLE IF NOT EXISTS callback_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller_number TEXT NOT NULL,
  caller_name TEXT DEFAULT '',
  matter TEXT DEFAULT '',
  call_sid TEXT,
  business_id UUID REFERENCES businesses ON DELETE SET NULL,
  handled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 011 — call_logs extended columns
-- ============================================================
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS twilio_call_sid TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS from_number TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS routed_from_main BOOLEAN DEFAULT false;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS routed_to_extension TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS routed_business_name TEXT;

-- ============================================================
-- 005 — businesses calendar + services columns
-- ============================================================
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS calendar_settings JSONB DEFAULT '{"monday": {"enabled": true, "start": "09:00", "end": "17:00"}, "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"}, "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"}, "thursday": {"enabled": true, "start": "09:00", "end": "17:00"}, "friday": {"enabled": true, "start": "09:00", "end": "17:00"}, "saturday": {"enabled": false, "start": "10:00", "end": "14:00"}, "sunday": {"enabled": false, "start": "00:00", "end": "00:00"}, "buffer_minutes": 15, "slot_interval": 30}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]';

-- ============================================================
-- 006 — reservations change workflow columns
-- ============================================================
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS change_token TEXT DEFAULT '';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS pending_changes JSONB DEFAULT NULL;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS caller_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS service_id UUID;

-- ============================================================
-- 007 + migration-add-business-columns — businesses extra columns
-- ============================================================
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT now() + interval '14 days';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES auth.users;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS reseller_markup DECIMAL(5,2) DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_url TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS extension TEXT;

-- 007 + scripts/migration-feedback-columns — feedback extra columns
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'voice';

-- 007 — call_logs recording_url
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS recording_url TEXT DEFAULT '';

-- ============================================================
-- Fix owner_uid FK constraint: ON DELETE CASCADE
-- ============================================================
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_owner_uid_fkey;
ALTER TABLE businesses ADD CONSTRAINT businesses_owner_uid_fkey
  FOREIGN KEY (owner_uid) REFERENCES auth.users ON DELETE CASCADE;

-- ============================================================
-- Indexes
-- ============================================================
-- 001
CREATE INDEX IF NOT EXISTS idx_call_logs_business_id ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_classification ON call_logs(classification);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_uid ON businesses(owner_uid);

-- contact_messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);

-- 003
CREATE INDEX IF NOT EXISTS idx_reservations_business_id ON reservations(business_id);
CREATE INDEX IF NOT EXISTS idx_reservations_reserved_at ON reservations(reserved_at);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_feedback_business_id ON feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_conversation_id ON feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);

-- 004
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_tokens_business ON calendar_tokens(business_id);

-- 008
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_coupon_usages_business ON coupon_usages(business_id);
CREATE INDEX IF NOT EXISTS idx_discount_rules_active ON discount_rules(active, start_at, end_at);

-- 010
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

-- 011
CREATE INDEX IF NOT EXISTS idx_call_logs_twilio_sid ON call_logs(twilio_call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_business_created ON call_logs(business_id, created_at DESC);

-- ivr
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_extension ON businesses(extension) WHERE extension IS NOT NULL;

-- ============================================================
-- RLS policies
-- ============================================================

-- businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS businesses_select_own ON businesses;
CREATE POLICY businesses_select_own ON businesses FOR SELECT USING (owner_uid = auth.uid());
DROP POLICY IF EXISTS businesses_update_own ON businesses;
CREATE POLICY businesses_update_own ON businesses FOR UPDATE USING (owner_uid = auth.uid());
DROP POLICY IF EXISTS businesses_insert_own ON businesses;
CREATE POLICY businesses_insert_own ON businesses FOR INSERT WITH CHECK (owner_uid = auth.uid());
DROP POLICY IF EXISTS businesses_admin_all ON businesses;
CREATE POLICY businesses_admin_all ON businesses USING (auth.role() = 'service_role');

-- call_logs
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS call_logs_select_own ON call_logs;
CREATE POLICY call_logs_select_own ON call_logs FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS call_logs_admin_all ON call_logs;
CREATE POLICY call_logs_admin_all ON call_logs USING (auth.role() = 'service_role');

-- leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leads_admin_all ON leads;
CREATE POLICY leads_admin_all ON leads USING (auth.role() = 'service_role');

-- reservations
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

-- feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feedback_select_own ON feedback;
CREATE POLICY feedback_select_own ON feedback FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS feedback_insert_service ON feedback;
CREATE POLICY feedback_insert_service ON feedback FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- calendar_tokens
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

-- coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS coupons_admin_all ON coupons;
CREATE POLICY coupons_admin_all ON coupons USING (auth.role() = 'service_role');

-- coupon_usages
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS coupon_usages_admin_all ON coupon_usages;
CREATE POLICY coupon_usages_admin_all ON coupon_usages USING (auth.role() = 'service_role');

-- discount_rules
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS discount_rules_admin_all ON discount_rules;
CREATE POLICY discount_rules_admin_all ON discount_rules USING (auth.role() = 'service_role');

-- conversations
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
DROP POLICY IF EXISTS conversations_admin_all ON conversations;
CREATE POLICY conversations_admin_all ON conversations USING (auth.role() = 'service_role');

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_select_own ON messages;
CREATE POLICY messages_select_own ON messages FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS messages_insert_own ON messages;
CREATE POLICY messages_insert_own ON messages FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS messages_admin_all ON messages;
CREATE POLICY messages_admin_all ON messages USING (auth.role() = 'service_role');

-- transcriptions
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS transcriptions_select_own ON transcriptions;
CREATE POLICY transcriptions_select_own ON transcriptions FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS transcriptions_insert_own ON transcriptions;
CREATE POLICY transcriptions_insert_own ON transcriptions FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
DROP POLICY IF EXISTS transcriptions_admin_all ON transcriptions;
CREATE POLICY transcriptions_admin_all ON transcriptions USING (auth.role() = 'service_role');

-- business_knowledge
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
DROP POLICY IF EXISTS business_knowledge_admin_all ON business_knowledge;
CREATE POLICY business_knowledge_admin_all ON business_knowledge USING (auth.role() = 'service_role');

-- dashboard_configs
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
DROP POLICY IF EXISTS dashboard_configs_admin_all ON dashboard_configs;
CREATE POLICY dashboard_configs_admin_all ON dashboard_configs USING (auth.role() = 'service_role');

-- contact_messages (no FK — public form, allow read for service_role)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contact_messages_admin_all ON contact_messages;
CREATE POLICY contact_messages_admin_all ON contact_messages USING (auth.role() = 'service_role');

-- callback_requests
ALTER TABLE callback_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS callback_requests_admin_all ON callback_requests;
CREATE POLICY callback_requests_admin_all ON callback_requests USING (auth.role() = 'service_role');

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 002 — Weekly minutes reset
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

-- 009 — Coupon usage increment
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

-- Triggers
DROP TRIGGER IF EXISTS update_reservations_modtime ON reservations;
CREATE TRIGGER update_reservations_modtime
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_calendar_tokens_modtime ON calendar_tokens;
CREATE TRIGGER update_calendar_tokens_modtime
  BEFORE UPDATE ON calendar_tokens
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_business_knowledge_modtime ON business_knowledge;
CREATE TRIGGER update_business_knowledge_modtime
  BEFORE UPDATE ON business_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_dashboard_configs_modtime ON dashboard_configs;
CREATE TRIGGER update_dashboard_configs_modtime
  BEFORE UPDATE ON dashboard_configs
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- Seed data
-- ============================================================
INSERT INTO coupons (code, description, discount_percent, max_uses, applicable_plans, valid_until)
VALUES ('WITAJ50', '50% zniżki na pierwszy miesiąc', 50, 100, '{}', now() + interval '90 days')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
SELECT 'WitaLine schema ready' AS status;

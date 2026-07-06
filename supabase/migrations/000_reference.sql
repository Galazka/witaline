-- ==========================================================================
-- WitaLine — Reference Schema (July 2026)
-- Idempotent: safe to run multiple times (CREATE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS)
-- Generated from: supabase/migrations/FULL_SETUP.sql + scripts/migrations/012-058
-- ==========================================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ==========================================================================
-- 1. TABLES (alphabetical)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS active_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  call_sid TEXT NOT NULL UNIQUE,
  conversation_id TEXT DEFAULT '',
  from_number TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS balance_topups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  amount_pln NUMERIC(10,2) DEFAULT 0,
  stripe_payment_intent_id TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blocked_callers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  reason TEXT DEFAULT '',
  blocked_by TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'viewer')),
  invited_by UUID REFERENCES auth.users,
  invite_token TEXT,
  invite_email TEXT,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, user_id)
);

CREATE TABLE IF NOT EXISTS business_pricing_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL UNIQUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  permissions JSONB DEFAULT '{}',
  invite_email TEXT,
  invite_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, user_id)
);

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  twilio_number TEXT,
  current_plan TEXT NOT NULL DEFAULT 'start_100' CHECK (current_plan IN (
    'start_100', 'pro_500', 'enterprise_2000', 'elastic_0', 'pro_249', 'lux_599'
  )),
  minutes_used_this_week INTEGER DEFAULT 0,
  system_prompt TEXT,
  menu_catalog JSONB DEFAULT '{}',
  calendar_settings JSONB DEFAULT '{
    "monday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "thursday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "friday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "saturday": {"enabled": false, "start": "10:00", "end": "14:00"},
    "sunday": {"enabled": false, "start": "00:00", "end": "00:00"},
    "buffer_minutes": 15,
    "slot_interval": 30
  }',
  services JSONB DEFAULT '[]',
  stripe_customer_id TEXT DEFAULT '',
  stripe_subscription_id TEXT DEFAULT '',
  subscription_status TEXT DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  reseller_id UUID REFERENCES auth.users,
  reseller_markup DECIMAL(5,2) DEFAULT 0,
  suspended BOOLEAN DEFAULT FALSE,
  industry TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  dtmf_code TEXT,
  slug TEXT UNIQUE,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users,
  two_factor_secret TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  webhook_url TEXT,
  webhook_secret TEXT,
  api_key TEXT UNIQUE,
  slack_webhook_url TEXT,
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  balance NUMERIC(10,2) DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  prepaid_minutes NUMERIC(10,2) DEFAULT 0,
  lifetime_purchased_minutes NUMERIC(10,2) DEFAULT 0,
  tokens_used_this_month INTEGER DEFAULT 0,
  voice_id UUID,
  sms_limit INTEGER DEFAULT 0,
  sms_used INTEGER DEFAULT 0,
  sms_extra_purchased INTEGER DEFAULT 0,
  wa_limit INTEGER DEFAULT 0,
  wa_used INTEGER DEFAULT 0,
  wa_extra_purchased INTEGER DEFAULT 0,
  rollover_minutes NUMERIC(10,2) DEFAULT 0,
  rollover_max_cap NUMERIC(10,2) DEFAULT 0,
  minutes_used_this_month INTEGER DEFAULT 0,
  last_rollover_at TIMESTAMPTZ,
  auto_topup_enabled BOOLEAN DEFAULT FALSE,
  auto_topup_minutes_threshold NUMERIC(10,2) DEFAULT 0,
  auto_topup_sms_threshold INTEGER DEFAULT 0,
  auto_topup_pack_size INTEGER DEFAULT 0,
  trial_minutes_used INTEGER DEFAULT 0,
  trial_sms_used INTEGER DEFAULT 0,
  referral_code TEXT,
  custom_monthly_revenue DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_tokens (
  business_id UUID PRIMARY KEY REFERENCES businesses ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL DEFAULT '',
  refresh_token TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ,
  calendar_email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  duration_seconds INTEGER DEFAULT 0,
  cost_pln NUMERIC(10,2) DEFAULT 0,
  caller_id TEXT,
  transcript TEXT DEFAULT '',
  classification TEXT NOT NULL DEFAULT 'unknown' CHECK (classification IN (
    'spam', 'offer', 'order', 'question', 'booking', 'unknown'
  )),
  ai_summary TEXT DEFAULT '',
  was_helpful BOOLEAN,
  recording_url TEXT DEFAULT '',
  to_number TEXT,
  rodo_consent_played BOOLEAN DEFAULT FALSE,
  rodo_consent_at TIMESTAMPTZ,
  elevenlabs_conversation_id TEXT,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  cost_elevenlabs NUMERIC(10,6) DEFAULT 0,
  cost_twilio NUMERIC(10,6) DEFAULT 0,
  cost_openrouter NUMERIC(10,6) DEFAULT 0,
  total_cost NUMERIC(10,6) DEFAULT 0,
  revenue_pln NUMERIC(10,2) DEFAULT 0,
  internal_cost_pln NUMERIC(10,2) DEFAULT 0,
  has_human_handoff BOOLEAN DEFAULT FALSE,
  handoff_status TEXT CHECK (handoff_status IN ('pending', 'in_progress', 'completed', 'failed')),
  handoff_reason TEXT,
  handoff_target_number TEXT,
  handoff_started_at TIMESTAMPTZ,
  handoff_ended_at TIMESTAMPTZ,
  handoff_duration_seconds INTEGER,
  handoff_recording_sid TEXT,
  handoff_recording_url TEXT DEFAULT '',
  post_handoff_transcript TEXT,
  consultant_transfer_cost_pln NUMERIC(10,2) DEFAULT 0,
  transferred_to_consultant BOOLEAN DEFAULT FALSE,
  quality_score INTEGER,
  quick_summary TEXT,
  flagged BOOLEAN DEFAULT FALSE,
  flag_color TEXT DEFAULT 'yellow',
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT CHECK (deleted_by IN ('business', 'admin')),
  from_number TEXT,
  from_city TEXT,
  from_country TEXT,
  call_status TEXT DEFAULT 'completed',
  answered_by TEXT,
  call_type TEXT DEFAULT 'inbound',
  duration_minutes NUMERIC(10,2) DEFAULT 0,
  sms_sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS callback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL,
  name TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  message TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  flagged BOOLEAN DEFAULT FALSE,
  flag_color TEXT DEFAULT 'yellow',
  deleted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'one-time', 'irregular')),
  category TEXT DEFAULT 'other',
  due_date DATE,
  is_paid BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now(),
  original_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS dtmf_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  from_number TEXT,
  dtmf_code TEXT NOT NULL,
  matched_extension TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  call_log_id UUID REFERENCES call_logs ON DELETE SET NULL,
  caller_phone TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'service', 'booking', 'support', 'complaint')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  priority INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  attempts INTEGER DEFAULT 0,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  nip TEXT NOT NULL,
  industry TEXT,
  knowledge_base_raw TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processed', 'active', 'trashed')),
  contact_email TEXT NOT NULL,
  type TEXT CHECK (type IN ('inbound', 'outbound', 'referral')),
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'human')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'lead', 'booking', 'feedback', 'system', 'sms')),
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS number_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  cost_pln NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  visitor_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS port_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  nip TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 10,
  used INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  referred_business_id UUID REFERENCES businesses ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  call_log_id UUID REFERENCES call_logs ON DELETE SET NULL,
  caller_name TEXT NOT NULL DEFAULT '',
  caller_phone TEXT NOT NULL DEFAULT '',
  service_type TEXT NOT NULL DEFAULT '',
  service_id UUID,
  reserved_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  change_token TEXT DEFAULT '',
  pending_changes JSONB DEFAULT NULL,
  caller_notified BOOLEAN DEFAULT FALSE,
  google_event_id TEXT,
  confirmed_at TIMESTAMPTZ,
  sms_confirmation_sent BOOLEAN DEFAULT FALSE,
  sms_reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rollover_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  plan_limit INTEGER DEFAULT 0,
  minutes_used INTEGER DEFAULT 0,
  rollover_added NUMERIC(10,2) DEFAULT 0,
  rollover_before NUMERIC(10,2) DEFAULT 0,
  rollover_after NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  call_log_id UUID REFERENCES call_logs ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations ON DELETE SET NULL,
  to_number TEXT,
  message_body TEXT,
  status TEXT DEFAULT 'sent',
  twilio_sid TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('support', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES support_conversations ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS transfer_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  caller_phone TEXT,
  call_sid TEXT,
  conference_room TEXT,
  consultant_id UUID,
  consultant_phone TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'connected', 'failed', 'timeout')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL UNIQUE,
  elevenlabs_voice_id TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  status TEXT DEFAULT 'creating' CHECK (status IN ('creating', 'active', 'failed')),
  samples_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  elevenlabs_voice_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  min_plan TEXT DEFAULT 'start_100',
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  event TEXT NOT NULL,
  url TEXT NOT NULL,
  status INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  total_duration_minutes NUMERIC(10,2) DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_sms_sent INTEGER DEFAULT 0,
  classification_breakdown JSONB DEFAULT '{}',
  peak_day TEXT,
  peak_hour INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, week_start)
);

-- ==========================================================================
-- 2. VIEWS
-- ==========================================================================

DROP VIEW IF EXISTS business_cost_report;
CREATE VIEW business_cost_report AS
SELECT
  b.id AS business_id,
  b.name AS business_name,
  COUNT(cl.id) AS total_calls,
  COALESCE(SUM(cl.total_cost), 0) AS total_cost_sum,
  COALESCE(SUM(cl.cost_elevenlabs), 0) AS total_elevenlabs,
  COALESCE(SUM(cl.cost_twilio), 0) AS total_twilio,
  COALESCE(SUM(cl.cost_openrouter), 0) AS total_openrouter,
  COALESCE(SUM(cl.revenue_pln), 0) AS total_revenue
FROM businesses b
LEFT JOIN call_logs cl ON cl.business_id = b.id AND cl.deleted_at IS NULL
GROUP BY b.id, b.name;

-- ==========================================================================
-- 3. INDEXES
-- ==========================================================================

CREATE INDEX IF NOT EXISTS idx_active_calls_call_sid ON active_calls(call_sid);
CREATE INDEX IF NOT EXISTS idx_active_calls_expires ON active_calls(expires_at);
CREATE INDEX IF NOT EXISTS idx_balance_topups_business ON balance_topups(business_id);
CREATE INDEX IF NOT EXISTS idx_blocked_callers_phone ON blocked_callers(phone);
CREATE INDEX IF NOT EXISTS idx_business_knowledge_business_id ON business_knowledge(business_id);
CREATE INDEX IF NOT EXISTS idx_business_knowledge_category ON business_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_business_members_invite_token ON business_members(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_owner_uid ON businesses(owner_uid);
CREATE INDEX IF NOT EXISTS idx_businesses_api_key ON businesses(api_key) WHERE api_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_2fa ON businesses(two_factor_enabled) WHERE two_factor_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_businesses_tokens_used ON businesses(tokens_used_this_month);
CREATE INDEX IF NOT EXISTS idx_calendar_tokens_expires ON calendar_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_call_logs_business_id ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_classification ON call_logs(classification);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_tokens_total ON call_logs(tokens_total);
CREATE INDEX IF NOT EXISTS idx_call_logs_elevenlabs_conv ON call_logs(elevenlabs_conversation_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_quality_score ON call_logs(quality_score) WHERE quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_deleted ON call_logs(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_consultant_transfer ON call_logs(transferred_to_consultant) WHERE transferred_to_consultant = TRUE;
CREATE INDEX IF NOT EXISTS idx_conversations_business_id ON conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_tokens_total ON conversations(tokens_total);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_coupon_usages_business ON coupon_usages(business_id);
CREATE INDEX IF NOT EXISTS idx_discount_rules_active ON discount_rules(active, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_dtmf_logs_business ON dtmf_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_dtmf_logs_created ON dtmf_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_business_id ON feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled ON job_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_business_id ON messages(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_number_purchases_business ON number_purchases(business_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON page_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_business ON page_visits(business_id);
CREATE INDEX IF NOT EXISTS idx_quick_replies_business ON business_quick_replies(business_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_business_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_coupons_business ON referral_coupons(business_id);
CREATE INDEX IF NOT EXISTS idx_referral_coupons_code ON referral_coupons(code);
CREATE INDEX IF NOT EXISTS idx_reservations_business_id ON reservations(business_id);
CREATE INDEX IF NOT EXISTS idx_reservations_reserved_at ON reservations(reserved_at);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_unique_active ON reservations(business_id, reserved_at) WHERE status != 'cancelled';
CREATE INDEX IF NOT EXISTS idx_reservations_upcoming ON reservations(reserved_at, status) WHERE status IN ('pending', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_sms_logs_business_id ON sms_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_stripe_packages_type ON call_logs(call_type);
CREATE INDEX IF NOT EXISTS idx_support_agents_user ON support_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_business_id ON transcriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_conversation_id ON transcriptions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfer_queue_status ON transfer_queue(status);
CREATE INDEX IF NOT EXISTS idx_transfer_queue_conference ON transfer_queue(conference_room);
CREATE INDEX IF NOT EXISTS idx_voicemails_business_id ON business_cost_report(business_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_business ON webhook_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_business ON weekly_reports(business_id);

-- ==========================================================================
-- 4. FUNCTIONS & TRIGGERS
-- ==========================================================================

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION reset_weekly_minutes()
RETURNS void AS $$
BEGIN
  UPDATE businesses SET minutes_used_this_week = 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION purge_old_records()
RETURNS void AS $$
BEGIN
  UPDATE call_logs
  SET transcript = '',
      ai_summary = '',
      recording_url = '',
      from_number = NULL,
      to_number = NULL
  WHERE created_at < now() - interval '30 days'
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION increment_sms_used(biz_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE businesses SET sms_used = COALESCE(sms_used, 0) + 1 WHERE id = biz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION process_monthly_rollover(p_business_id UUID)
RETURNS void AS $$
DECLARE
  v_plan_limit INTEGER;
  v_minutes_used INTEGER;
  v_rollover NUMERIC(10,2);
  v_cap NUMERIC(10,2);
BEGIN
  SELECT
    CASE
      WHEN current_plan = 'start_100' THEN 100
      WHEN current_plan = 'pro_500' THEN 500
      WHEN current_plan = 'enterprise_2000' THEN 2000
      WHEN current_plan = 'elastic_0' THEN 0
      WHEN current_plan = 'pro_249' THEN 500
      WHEN current_plan = 'lux_599' THEN 2000
      ELSE 100
    END,
    COALESCE(minutes_used_this_month, 0),
    COALESCE(rollover_max_cap, 0)
  INTO v_plan_limit, v_minutes_used, v_cap
  FROM businesses WHERE id = p_business_id;

  v_plan_limit := GREATEST(v_plan_limit, 100);
  v_rollover := LEAST(
    GREATEST(v_plan_limit - v_minutes_used, 0),
    GREATEST(v_cap, v_plan_limit * 2)
  );

  INSERT INTO rollover_logs (business_id, plan_limit, minutes_used, rollover_added, rollover_before, rollover_after)
  VALUES (p_business_id, v_plan_limit, v_minutes_used, v_rollover, 0, v_rollover);

  UPDATE businesses
  SET rollover_minutes = v_rollover,
      last_rollover_at = now(),
      minutes_used_this_month = 0
  WHERE id = p_business_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-insert owner into business_members on business creation
CREATE OR REPLACE FUNCTION auto_add_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO business_members (business_id, user_id, role)
  VALUES (NEW.id, NEW.owner_uid, 'owner')
  ON CONFLICT (business_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_add_owner ON businesses;
CREATE TRIGGER trg_auto_add_owner
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_owner_membership();

-- Timestamp triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reservations_modtime') THEN
    CREATE TRIGGER update_reservations_modtime
      BEFORE UPDATE ON reservations
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_calendar_tokens_modtime') THEN
    CREATE TRIGGER update_calendar_tokens_modtime
      BEFORE UPDATE ON calendar_tokens
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Cron: weekly minute reset (Monday 23:00)
SELECT cron.schedule(
  'reset-weekly-minutes',
  '0 23 * * 1',
  'SELECT reset_weekly_minutes();'
);

-- Cron: daily purge of old records (3:00 AM)
SELECT cron.schedule(
  'purge-old-records-daily',
  '0 3 * * *',
  'SELECT purge_old_records();'
);

-- ==========================================================================
-- 5. ROW LEVEL SECURITY
-- ==========================================================================

-- Helper: apply RLS policies idempotently using DO blocks
DO $$
BEGIN
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

  -- sms_logs
  ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS sms_logs_admin_all ON sms_logs;
  CREATE POLICY sms_logs_admin_all ON sms_logs USING (auth.role() = 'service_role');

  -- business_members
  ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS business_members_select_own ON business_members;
  CREATE POLICY business_members_select_own ON business_members FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );
  DROP POLICY IF EXISTS business_members_insert_own ON business_members;
  CREATE POLICY business_members_insert_own ON business_members FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );
  DROP POLICY IF EXISTS business_members_update_own ON business_members;
  CREATE POLICY business_members_update_own ON business_members FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );
  DROP POLICY IF EXISTS business_members_delete_own ON business_members;
  CREATE POLICY business_members_delete_own ON business_members FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

  -- notifications
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS notifications_select_own ON notifications;
  CREATE POLICY notifications_select_own ON notifications FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

  -- voice_clones
  ALTER TABLE voice_clones ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS voice_clones_select_own ON voice_clones;
  CREATE POLICY voice_clones_select_own ON voice_clones FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );
  DROP POLICY IF EXISTS voice_clones_insert_own ON voice_clones;
  CREATE POLICY voice_clones_insert_own ON voice_clones FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

  -- business_consultants
  ALTER TABLE business_consultants ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS business_consultants_owner_all ON business_consultants;
  CREATE POLICY business_consultants_owner_all ON business_consultants USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

  -- port_requests
  ALTER TABLE port_requests ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS port_requests_owner_select ON port_requests;
  CREATE POLICY port_requests_owner_select ON port_requests FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );
  DROP POLICY IF EXISTS port_requests_owner_insert ON port_requests;
  CREATE POLICY port_requests_owner_insert ON port_requests FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

  -- cost_items
  ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;

  -- pricing_config
  ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

  -- business_pricing_overrides
  ALTER TABLE business_pricing_overrides ENABLE ROW LEVEL SECURITY;

  -- business_staff
  ALTER TABLE business_staff ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS business_staff_select_own ON business_staff;
  CREATE POLICY business_staff_select_own ON business_staff FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );
  DROP POLICY IF EXISTS business_staff_insert_own ON business_staff;
  CREATE POLICY business_staff_insert_own ON business_staff FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );
  DROP POLICY IF EXISTS business_staff_update_own ON business_staff;
  CREATE POLICY business_staff_update_own ON business_staff FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );
  DROP POLICY IF EXISTS business_staff_delete_own ON business_staff;
  CREATE POLICY business_staff_delete_own ON business_staff FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

  -- support tables
  ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
  ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE transfer_queue ENABLE ROW LEVEL SECURITY;
  ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
  ALTER TABLE active_calls ENABLE ROW LEVEL SECURITY;
  ALTER TABLE balance_topups ENABLE ROW LEVEL SECURITY;
  ALTER TABLE number_purchases ENABLE ROW LEVEL SECURITY;
  ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
  ALTER TABLE rollover_logs ENABLE ROW LEVEL SECURITY;
END $$;

-- ==========================================================================
-- 6. SEED DATA
-- ==========================================================================

INSERT INTO coupons (code, description, discount_percent, max_uses, applicable_plans, valid_until)
VALUES ('WITAJ50', '50% zniżki na pierwszy miesiąc', 50, 100, '{}', now() + interval '90 days')
ON CONFLICT (code) DO NOTHING;

INSERT INTO email_templates (key, subject, html, description)
VALUES (
  'welcome',
  'Witaj w WitaLine!',
  '<h1>Witamy w WitaLine!</h1><p>Dziękujemy za rejestrację.</p>',
  'Welcome email sent after registration'
) ON CONFLICT (key) DO NOTHING;

INSERT INTO email_templates (key, subject, html, description)
VALUES (
  'auto_topup_success',
  'Auto-doładowanie wykonane',
  '<p>Twoje konto zostało automatycznie doładowane.</p>',
  'Auto-topup success notification'
) ON CONFLICT (key) DO NOTHING;

INSERT INTO email_templates (key, subject, html, description)
VALUES (
  'auto_topup_failed',
  'Auto-doładowanie nie powiodło się',
  '<p>Nie udało się doładować konta. Sprawdź metodę płatności.</p>',
  'Auto-topup failure notification'
) ON CONFLICT (key) DO NOTHING;

INSERT INTO email_templates (key, subject, html, description)
VALUES (
  'auto_topup_no_card',
  'Brak karty do auto-doładowania',
  '<p>Dodaj kartę płatniczą, aby korzystać z auto-doładowania.</p>',
  'Auto-topup no card notification'
) ON CONFLICT (key) DO NOTHING;

INSERT INTO pricing_config (name, is_active, config)
VALUES (
  'default',
  true,
  '{
    "minute_rate": 1.20,
    "sms_per_minute": 0.42,
    "free_sms_per_package": 20,
    "auto_topup_minutes_min": 500,
    "auto_topup_sms_min": 100
  }'
) ON CONFLICT (name) DO NOTHING;

-- Voices (Maja + Tomasz variants)
INSERT INTO voices (display_name, gender, elevenlabs_voice_id, is_default, min_plan, active, sort_order) VALUES
  ('Maja - domyślna', 'female', 'tWVHsc0fuVfAZWfScX9a', TRUE, 'start_100', TRUE, 0),
  ('Maja - ciepła', 'female', 'XB0LxvG6BChEsZSsoG1M', FALSE, 'start_100', TRUE, 1),
  ('Maja - profesjonalna', 'female', 'Uz7U4f6DS2BnXT10Bn6H', FALSE, 'pro_500', TRUE, 2),
  ('Maja - spokojna', 'female', 'QfLwB9UOo4PcCz7CM6Fr', FALSE, 'pro_500', TRUE, 3),
  ('Maja - naturalna', 'female', 'v4VXqYQPCvcYwkDCEKRz', FALSE, 'enterprise_2000', TRUE, 4),
  ('Tomasz - domyślny', 'male', 'iP95p4coKVv6GpYcGQfm', FALSE, 'start_100', TRUE, 5),
  ('Tomasz - ciepły', 'male', 'y3R2G17mXBnC8ThLEdp4', FALSE, 'start_100', TRUE, 6),
  ('Tomasz - profesjonalny', 'male', 'pNInz6obpgDQGcXmaqSg', FALSE, 'pro_500', TRUE, 7),
  ('Tomasz - spokojny', 'male', 'n1NfP8RbZQvWky6DcL7j', FALSE, 'pro_500', TRUE, 8),
  ('Tomasz - naturalny', 'male', 'kKx3M2A9VfBp7R4LqJ8t', FALSE, 'enterprise_2000', TRUE, 9)
ON CONFLICT DO NOTHING;

-- ==========================================================================
-- DONE
-- ==========================================================================
SELECT 'WitaLine reference schema applied' AS status;

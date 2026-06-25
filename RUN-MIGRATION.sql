-- ================================================================
-- WitaLine - COMPREHENSIVE MIGRATION
-- Wklej CAŁOŚĆ do Supabase SQL Editor (web) i kliknij RUN
-- Safe to run multiple times (IF NOT EXISTS guards)
-- ================================================================

-- 1. Add phone column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';

-- 2. Add business_id column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;

-- 3. Add status column to call_logs (if not exists)
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- 4. Drop old constraint FIRST before updating data
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_classification_check;

-- 5. Now update classification safely (no constraint to violate)
UPDATE call_logs SET classification = 'question' WHERE classification = 'inquiry';
UPDATE call_logs SET classification = 'unknown' WHERE classification NOT IN ('question', 'order', 'spam', 'offer', 'booking', 'unknown');

-- 6. Add new constraint with all valid values
ALTER TABLE call_logs ADD CONSTRAINT call_logs_classification_check
  CHECK (classification IN ('spam', 'offer', 'order', 'question', 'booking', 'unknown'));
ALTER TABLE call_logs ALTER COLUMN classification SET DEFAULT 'unknown';

-- 7. Blocked callers table (idempotent)
CREATE TABLE IF NOT EXISTS blocked_callers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  reason TEXT DEFAULT '',
  blocked_by TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blocked_callers_phone ON blocked_callers(phone);

-- 8. DTMF code column for businesses (idempotent)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS dtmf_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_dtmf_code ON businesses(dtmf_code) WHERE dtmf_code IS NOT NULL;

-- 9. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'lead', 'booking', 'feedback', 'system', 'sms')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_owner_select" ON notifications;
CREATE POLICY "notifications_owner_select"
  ON notifications FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
DROP POLICY IF EXISTS "notifications_owner_update" ON notifications;
CREATE POLICY "notifications_owner_update"
  ON notifications FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
DROP POLICY IF EXISTS "notifications_service_insert" ON notifications;
CREATE POLICY "notifications_service_insert"
  ON notifications FOR INSERT WITH CHECK (true);

-- 10. Real-cost columns on call_logs
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS cost_elevenlabs DECIMAL(10,4) DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS cost_twilio DECIMAL(10,4) DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS cost_openrouter DECIMAL(10,4) DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,4) DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS revenue_pln DECIMAL(10,2) DEFAULT 0;

-- 11. Voice clones table
CREATE TABLE IF NOT EXISTS voice_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  elevenlabs_voice_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT DEFAULT 'creating' CHECK (status IN ('creating', 'active', 'failed')),
  samples_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id)
);
ALTER TABLE voice_clones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "voice_clones_owner_all" ON voice_clones;
CREATE POLICY "voice_clones_owner_all"
  ON voice_clones FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));

-- 12. Weekly reports table
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_calls INT DEFAULT 0,
  total_duration_minutes INT DEFAULT 0,
  total_leads INT DEFAULT 0,
  total_bookings INT DEFAULT 0,
  total_sms_sent INT DEFAULT 0,
  classification_breakdown JSONB DEFAULT '{}',
  peak_day TEXT,
  peak_hour INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, week_start)
);
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "weekly_reports_owner_select" ON weekly_reports;
CREATE POLICY "weekly_reports_owner_select"
  ON weekly_reports FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));

-- 13. Business slug for public booking page
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
UPDATE businesses SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) WHERE slug IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug) WHERE slug IS NOT NULL;

-- 14. WhatsApp continuity — business columns
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_limit INT DEFAULT 50;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_used INT DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_extra_purchased INT DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- 15. WhatsApp message logs
CREATE TABLE IF NOT EXISTS wa_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  call_log_id UUID REFERENCES call_logs(id) ON DELETE SET NULL,
  to_number TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  twilio_sid TEXT,
  error_message TEXT,
  profile_name TEXT,
  has_media BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_logs_business_id ON wa_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_wa_logs_created_at ON wa_logs(created_at DESC);
ALTER TABLE wa_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wa_logs_owner_select" ON wa_logs;
CREATE POLICY "wa_logs_owner_select"
  ON wa_logs FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
DROP POLICY IF EXISTS "wa_logs_service_insert" ON wa_logs;
CREATE POLICY "wa_logs_service_insert"
  ON wa_logs FOR INSERT WITH CHECK (true);

-- 16. Human handoff recording/transcription
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS has_human_handoff BOOLEAN DEFAULT false;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_status TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_reason TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_target_number TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_started_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_ended_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_duration_seconds INTEGER DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_recording_sid TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_recording_url TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS post_handoff_transcript TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS post_handoff_summary TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS post_handoff_transcription_status TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS post_handoff_transcribed_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS post_handoff_error TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_call_logs_human_handoff ON call_logs(has_human_handoff);
CREATE INDEX IF NOT EXISTS idx_call_logs_handoff_status ON call_logs(handoff_status);
CREATE INDEX IF NOT EXISTS idx_call_logs_handoff_target ON call_logs(handoff_target_number);

-- 17. Trial usage tracking (15 min / 10 SMS caps)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_minutes_used DECIMAL(10,2) DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_sms_used INTEGER DEFAULT 0;

-- ================================================================
-- Verify migrations
-- ================================================================
-- SELECT 'leads columns:' AS info, column_name FROM information_schema.columns WHERE table_name = 'leads' ORDER BY ordinal_position;
-- SELECT 'call_logs columns:' AS info, column_name FROM information_schema.columns WHERE table_name = 'call_logs' ORDER BY ordinal_position;
-- SELECT 'businesses columns:' AS info, column_name FROM information_schema.columns WHERE table_name = 'businesses' ORDER BY ordinal_position;

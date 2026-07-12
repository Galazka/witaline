-- ============================================================
-- WitaLine — Scale to 500+ Clients
-- active_calls table, job_queue table, missing indexes
-- ============================================================

-- 1. ACTIVE CALLS (replaces in-memory Map)
CREATE TABLE IF NOT EXISTS active_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  call_sid TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '2 hours'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_calls_call_sid ON active_calls(call_sid);
CREATE INDEX IF NOT EXISTS idx_active_calls_business_id ON active_calls(business_id);
CREATE INDEX IF NOT EXISTS idx_active_calls_expires_at ON active_calls(expires_at);

-- Auto-cleanup expired active calls
CREATE OR REPLACE FUNCTION cleanup_expired_active_calls()
RETURNS void AS $$
BEGIN
  DELETE FROM active_calls WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- 2. JOB QUEUE (background job system)
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status, priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(type);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled ON job_queue(scheduled_at) WHERE status = 'pending';

-- 3. PENDING TRANSFERS (replaces in-memory Map)
CREATE TABLE IF NOT EXISTS pending_transfers (
  call_sid TEXT PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  target_number TEXT NOT NULL,
  caller_id TEXT NOT NULL DEFAULT '',
  business_name TEXT NOT NULL DEFAULT '',
  from_number TEXT NOT NULL DEFAULT '',
  to_number TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 minutes'
);

CREATE INDEX IF NOT EXISTS idx_pending_transfers_business_id ON pending_transfers(business_id);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_expires_at ON pending_transfers(expires_at);

-- 4. MISSING INDEXES for performance at scale
CREATE INDEX IF NOT EXISTS idx_businesses_twilio_number ON businesses(twilio_number) WHERE twilio_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_extension ON businesses(extension) WHERE extension IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status ON businesses(subscription_status);
CREATE INDEX IF NOT EXISTS idx_businesses_suspended ON businesses(suspended) WHERE suspended = TRUE;

CREATE INDEX IF NOT EXISTS idx_call_logs_elevenlabs_conv ON call_logs(elevenlabs_conversation_id) WHERE elevenlabs_conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_business_ended ON call_logs(business_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_handoff_recording ON call_logs(handoff_recording_sid) WHERE handoff_recording_sid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);

-- Safe index creation: check if table exists first
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_consultants' AND column_name = 'business_id') THEN
    CREATE INDEX IF NOT EXISTS idx_business_consultants_business_id ON business_consultants(business_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_members' AND column_name = 'business_id') THEN
    CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON business_members(business_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_logs' AND column_name = 'business_id') THEN
    CREATE INDEX IF NOT EXISTS idx_sms_logs_business_id ON sms_logs(business_id, created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wa_logs' AND column_name = 'business_id') THEN
    CREATE INDEX IF NOT EXISTS idx_wa_logs_business_id ON wa_logs(business_id, created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blocked_callers' AND column_name = 'phone') THEN
    CREATE INDEX IF NOT EXISTS idx_blocked_callers_phone ON blocked_callers(phone);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_packages' AND column_name = 'type') THEN
    CREATE INDEX IF NOT EXISTS idx_stripe_packages_type ON stripe_packages(type);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voicemails' AND column_name = 'business_id') THEN
    CREATE INDEX IF NOT EXISTS idx_voicemails_business_id ON voicemails(business_id);
  END IF;
END $$;

SELECT '043-scale-500 migration complete' AS status;

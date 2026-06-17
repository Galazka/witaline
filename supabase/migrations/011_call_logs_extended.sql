
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS twilio_call_sid TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS from_number TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS routed_from_main BOOLEAN DEFAULT false;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS routed_to_extension TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS routed_business_name TEXT;

CREATE INDEX IF NOT EXISTS idx_call_logs_twilio_sid ON call_logs(twilio_call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_business_created ON call_logs(business_id, created_at DESC);

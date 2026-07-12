CREATE TABLE IF NOT EXISTS dtmf_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  from_number TEXT,
  dtmf_code TEXT,
  matched_extension TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dtmf_logs_business ON dtmf_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_dtmf_logs_created ON dtmf_logs(created_at DESC);
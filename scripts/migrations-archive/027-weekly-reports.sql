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
CREATE POLICY "Business owners can view their reports"
  ON weekly_reports FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));

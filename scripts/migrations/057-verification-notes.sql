-- Add admin notes column to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create verification history log
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  old_status TEXT,
  new_status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_verification_logs_business_id ON verification_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS blocked_callers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  reason TEXT DEFAULT '',
  blocked_by TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_callers_phone ON blocked_callers(phone);

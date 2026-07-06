CREATE TABLE IF NOT EXISTS transfer_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  caller_phone TEXT NOT NULL,
  call_sid TEXT,
  conference_room TEXT NOT NULL,
  consultant_id UUID REFERENCES business_consultants(id),
  consultant_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfer_queue_status ON transfer_queue(status);
CREATE INDEX IF NOT EXISTS idx_transfer_queue_conference ON transfer_queue(conference_room);

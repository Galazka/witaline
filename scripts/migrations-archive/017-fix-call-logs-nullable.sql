-- Make business_id nullable for main-line calls (00000000-0000-0000-0000-000000000001)
ALTER TABLE call_logs ALTER COLUMN business_id DROP NOT NULL;

-- Add default values for required fields that might be missing in early inserts
ALTER TABLE call_logs ALTER COLUMN duration_seconds SET DEFAULT 0;
ALTER TABLE call_logs ALTER COLUMN cost_pln SET DEFAULT 0;
ALTER TABLE call_logs ALTER COLUMN classification SET DEFAULT 'inquiry';

-- Add recording_url column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_logs' AND column_name = 'recording_url'
  ) THEN
    ALTER TABLE call_logs ADD COLUMN recording_url TEXT DEFAULT '';
  END IF;
END $$;

-- Add to_number column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_logs' AND column_name = 'to_number'
  ) THEN
    ALTER TABLE call_logs ADD COLUMN to_number TEXT DEFAULT '';
  END IF;
END $$;

-- Add RODO consent columns if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_logs' AND column_name = 'rodo_consent_played'
  ) THEN
    ALTER TABLE call_logs ADD COLUMN rodo_consent_played BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_logs' AND column_name = 'rodo_consent_at'
  ) THEN
    ALTER TABLE call_logs ADD COLUMN rodo_consent_at TIMESTAMPTZ;
  END IF;
END $$;

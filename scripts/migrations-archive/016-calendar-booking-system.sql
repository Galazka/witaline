-- 016 — Calendar booking system: double-booking lock, Google Calendar sync, SMS notifications

-- Add Google Calendar event ID to reservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS google_event_id TEXT DEFAULT NULL;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS sms_confirmation_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS sms_reminder_sent BOOLEAN DEFAULT FALSE;

-- Partial unique index: prevents double-booking for active (non-cancelled) reservations
-- Two active reservations cannot have the same reserved_at time for the same business
DROP INDEX IF EXISTS idx_reservations_unique_active;
CREATE UNIQUE INDEX idx_reservations_unique_active 
  ON reservations(business_id, reserved_at) 
  WHERE status != 'cancelled';

-- Index for looking up upcoming reservations for SMS reminders
CREATE INDEX IF NOT EXISTS idx_reservations_upcoming 
  ON reservations(business_id, reserved_at, status) 
  WHERE status IN ('pending', 'confirmed');

-- SMS daily limits per business plan
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS sms_limit INTEGER DEFAULT 50;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS sms_used INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS sms_extra_purchased INTEGER DEFAULT 0;

-- SMS log now references the reservation
ALTER TABLE sms_logs ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL;

-- Page visits tracking for stats
CREATE TABLE IF NOT EXISTS page_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path TEXT NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  visitor_ip TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON page_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_business ON page_visits(business_id);

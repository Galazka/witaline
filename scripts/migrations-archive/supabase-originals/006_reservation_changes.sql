-- Reservation change workflow

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS change_token TEXT DEFAULT '';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS pending_changes JSONB DEFAULT NULL;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS caller_notified BOOLEAN DEFAULT FALSE;

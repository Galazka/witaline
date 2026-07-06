-- WitaLine - Built-in Calendar & Services (primary), Google Sync (optional)

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS calendar_settings JSONB DEFAULT '{
  "monday":    {"enabled": true,  "start": "09:00", "end": "17:00"},
  "tuesday":   {"enabled": true,  "start": "09:00", "end": "17:00"},
  "wednesday": {"enabled": true,  "start": "09:00", "end": "17:00"},
  "thursday":  {"enabled": true,  "start": "09:00", "end": "17:00"},
  "friday":    {"enabled": true,  "start": "09:00", "end": "17:00"},
  "saturday":  {"enabled": false, "start": "10:00", "end": "14:00"},
  "sunday":    {"enabled": false, "start": "00:00", "end": "00:00"},
  "buffer_minutes": 15,
  "slot_interval": 30
}';

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]';

-- Calendar sync tokens (Google/Outlook etc) — already has calendar_tokens table from 004.

-- Reservations: add optional service_id reference
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS service_id UUID;

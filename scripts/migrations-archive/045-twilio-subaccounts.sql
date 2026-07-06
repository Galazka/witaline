ALTER TABLE businesses ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT DEFAULT '';

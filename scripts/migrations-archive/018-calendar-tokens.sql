-- Tworzenie tabeli calendar_tokens (OAuth tokeny Google Calendar)
CREATE TABLE IF NOT EXISTS calendar_tokens (
  business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_tokens_expires ON calendar_tokens(expires_at);

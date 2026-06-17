-- WitaLine - Google Calendar integration

CREATE TABLE calendar_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL DEFAULT '',
  refresh_token TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ,
  calendar_email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_calendar_tokens_business ON calendar_tokens(business_id);

ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_tokens_select_own ON calendar_tokens
  FOR SELECT
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

CREATE POLICY calendar_tokens_insert_own ON calendar_tokens
  FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

CREATE POLICY calendar_tokens_update_own ON calendar_tokens
  FOR UPDATE
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

CREATE TRIGGER update_calendar_tokens_modtime
  BEFORE UPDATE ON calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

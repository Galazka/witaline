-- 2FA (TOTP) support for business owners
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS two_factor_secret text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false;

-- Index for 2FA checks
CREATE INDEX IF NOT EXISTS idx_businesses_2fa ON businesses (owner_uid, two_factor_enabled) WHERE two_factor_enabled = true;

-- Invite tokens for multi-user team access
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS invite_token text;
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS invite_email text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_members_invite_token ON business_members (invite_token) WHERE invite_token IS NOT NULL;

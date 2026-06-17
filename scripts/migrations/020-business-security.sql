-- ============================================
-- MIGRATION 020: Business Security & Verification
-- ============================================

-- 1. Business members (RBAC) — who can access which business
CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- 2. Business verification status
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified'
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS nip TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS krs TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verification_doc_url TEXT;

-- 3. Two-factor authentication
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS two_factor_verified_at TIMESTAMPTZ;

-- 4. Audit log — all changes to business data
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'update_name', 'update_prompt', 'update_voice', 'update_plan', 'update_settings', 'login', 'invite_member', etc.
  field_name TEXT, -- which field was changed
  old_value TEXT, -- previous value (truncated to 2000 chars)
  new_value TEXT, -- new value (truncated to 2000 chars)
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_business ON audit_log(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- 6. RLS policies (Row Level Security)
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- business_members: users can see their own memberships
DROP POLICY IF EXISTS "members_own_membership" ON business_members;
CREATE POLICY "members_own_membership" ON business_members
  FOR SELECT USING (user_id = auth.uid());

-- business_members: owners can manage members
DROP POLICY IF EXISTS "owners_manage_members" ON business_members;
CREATE POLICY "owners_manage_members" ON business_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'owner'
    )
  );

-- audit_log: members can read their business logs
DROP POLICY IF EXISTS "members_read_audit" ON audit_log;
CREATE POLICY "members_read_audit" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = audit_log.business_id
      AND bm.user_id = auth.uid()
    )
  );

-- 7. Auto-create owner membership when business is created
-- (handled in application code, but add trigger as safety net)
CREATE OR REPLACE FUNCTION auto_add_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO business_members (business_id, user_id, role, accepted_at)
  VALUES (NEW.id, NEW.owner_uid, 'owner', now())
  ON CONFLICT (business_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_owner ON businesses;
CREATE TRIGGER trigger_auto_owner
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_owner_membership();

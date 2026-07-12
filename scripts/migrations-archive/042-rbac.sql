-- ============================================================
-- 042: RBAC — role, uprawnienia, weryfikacja, audit log
-- ============================================================

-- Weryfikacja firmy
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending'
  CHECK (verification_status IN ('pending', 'verified', 'rejected'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users;

-- Pracownicy firmy (RBAC)
CREATE TABLE IF NOT EXISTS business_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'receptionist'
    CHECK (role IN ('admin', 'manager', 'receptionist', 'viewer')),
  permissions TEXT[] NOT NULL DEFAULT '{}',
  invited_by UUID REFERENCES auth.users,
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(business_id, user_id)
);

-- Śledzenie kto utworzył rezerwację
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS created_by_type TEXT DEFAULT 'ai_agent'
  CHECK (created_by_type IN ('ai_agent', 'admin', 'staff', 'client'));
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users;

-- Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

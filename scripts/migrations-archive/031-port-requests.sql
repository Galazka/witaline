-- ============================================================
-- 031-port-requests.sql
-- Tabela zgłoszeń przeniesienia numeru telefonu do WitaLine
-- ============================================================

CREATE TABLE IF NOT EXISTS port_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  nip TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_port_requests_business_id ON port_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_port_requests_status ON port_requests(status);

ALTER TABLE port_requests ENABLE ROW LEVEL SECURITY;

-- Admin ma pełny dostęp
CREATE POLICY "admin_all_port_requests" ON port_requests
  FOR ALL USING (true) WITH CHECK (true);

-- Właściciel firmy widzi tylko swoje zgłoszenia
CREATE POLICY "owner_view_port_requests" ON port_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = port_requests.business_id
      AND b.owner_uid = auth.uid()
    )
  );

-- Właściciel firmy może utworzyć zgłoszenie
CREATE POLICY "owner_insert_port_requests" ON port_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = port_requests.business_id
      AND b.owner_uid = auth.uid()
    )
  );
-- ============================================================
-- 030-business-consultants.sql
-- Lista konsultantów dla firm i głównej linii WitaLine
-- Kolejność = sort_order. Przy przekierowaniu wywołuje
-- kolejnych, jeśli poprzedni nie odbiera w ~4 sygnałów.
-- ============================================================

CREATE TABLE IF NOT EXISTS business_consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_consultants_business_id
  ON business_consultants(business_id);

-- RLS
ALTER TABLE business_consultants ENABLE ROW LEVEL SECURITY;

-- Admin (admin@witaline.pl) ma pełny dostęp
CREATE POLICY "admin_all_consultants" ON business_consultants
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Właściciel firmy widzi i edytuje tylko swoich konsultantów
CREATE POLICY "owner_manage_consultants" ON business_consultants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_consultants.business_id
      AND b.owner_uid = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_consultants.business_id
      AND b.owner_uid = auth.uid()
    )
  );

-- Członkowie zespołu (role edit) widzą listę konsultantów
CREATE POLICY "member_view_consultants" ON business_consultants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_consultants.business_id
      AND bm.user_id = auth.uid()
    )
  );
ALTER TABLE business_staff ADD COLUMN IF NOT EXISTS invite_email TEXT;
ALTER TABLE business_staff ADD COLUMN IF NOT EXISTS invite_token TEXT;

ALTER TABLE business_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_select_own" ON business_staff;
CREATE POLICY "staff_select_own" ON business_staff FOR SELECT USING (
  user_id = auth.uid() OR
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

DROP POLICY IF EXISTS "staff_insert_owner" ON business_staff;
CREATE POLICY "staff_insert_owner" ON business_staff FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

DROP POLICY IF EXISTS "staff_update_owner" ON business_staff;
CREATE POLICY "staff_update_owner" ON business_staff FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

DROP POLICY IF EXISTS "staff_delete_owner" ON business_staff;
CREATE POLICY "staff_delete_owner" ON business_staff FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);

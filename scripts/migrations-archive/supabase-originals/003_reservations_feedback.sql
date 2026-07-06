-- WitaLine - Reservations & Feedback System

-- ============================================
-- RESERVATIONS
-- ============================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  call_log_id UUID REFERENCES call_logs ON DELETE SET NULL,
  caller_name TEXT NOT NULL DEFAULT '',
  caller_phone TEXT NOT NULL DEFAULT '',
  service_type TEXT NOT NULL DEFAULT '',
  reserved_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reservations_business_id ON reservations(business_id);
CREATE INDEX idx_reservations_reserved_at ON reservations(reserved_at);
CREATE INDEX idx_reservations_status ON reservations(status);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY reservations_select_own ON reservations
  FOR SELECT
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

CREATE POLICY reservations_insert_own ON reservations
  FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

CREATE POLICY reservations_update_own ON reservations
  FOR UPDATE
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

CREATE POLICY reservations_delete_own ON reservations
  FOR DELETE
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

-- ============================================
-- FEEDBACK
-- ============================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  call_log_id UUID REFERENCES call_logs ON DELETE SET NULL,
  caller_phone TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  category TEXT DEFAULT 'general'
    CHECK (category IN ('general', 'service', 'booking', 'support', 'complaint')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feedback_business_id ON feedback(business_id);
CREATE INDEX idx_feedback_rating ON feedback(rating);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY feedback_select_own ON feedback
  FOR SELECT
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
  );

-- service_role can insert feedback (from ElevenLabs webhook)
CREATE POLICY feedback_insert_service ON feedback
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_reservations_modtime
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

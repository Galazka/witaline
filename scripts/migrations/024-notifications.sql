CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'lead', 'booking', 'feedback', 'system', 'sms')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_business_id ON notifications(business_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their notifications"
  ON notifications FOR SELECT
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_uid = auth.uid()
  ));

CREATE POLICY "Business owners can update their notifications"
  ON notifications FOR UPDATE
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_uid = auth.uid()
  ));

CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

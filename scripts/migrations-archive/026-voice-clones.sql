CREATE TABLE IF NOT EXISTS voice_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  elevenlabs_voice_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT DEFAULT 'creating' CHECK (status IN ('creating', 'active', 'failed')),
  samples_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id)
);

ALTER TABLE voice_clones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage voice clones"
  ON voice_clones FOR ALL
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_uid = auth.uid()
  ));

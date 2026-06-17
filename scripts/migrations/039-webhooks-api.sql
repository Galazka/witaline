-- 039: Outbound webhooks + REST API keys

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS webhook_secret TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  url TEXT NOT NULL,
  status INT,
  response_body TEXT,
  duration_ms INT,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_business ON webhook_logs(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_api_key ON businesses(api_key) WHERE api_key IS NOT NULL;

ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS cost_elevenlabs DECIMAL(10,4) DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS cost_twilio DECIMAL(10,4) DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS cost_openrouter DECIMAL(10,4) DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,4) DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS revenue_pln DECIMAL(10,2) DEFAULT 0;

-- Widok do raportowania kosztów
CREATE OR REPLACE VIEW business_cost_report AS
SELECT
  b.id AS business_id,
  b.name AS business_name,
  b.owner_uid,
  COUNT(cl.id) AS total_calls,
  COALESCE(SUM(cl.duration_seconds), 0) AS total_duration_seconds,
  COALESCE(SUM(cl.cost_elevenlabs), 0) AS total_cost_elevenlabs,
  COALESCE(SUM(cl.cost_twilio), 0) AS total_cost_twilio,
  COALESCE(SUM(cl.cost_openrouter), 0) AS total_cost_openrouter,
  COALESCE(SUM(cl.total_cost), 0) AS total_cost,
  COALESCE(SUM(cl.revenue_pln), 0) AS total_revenue_pln,
  COUNT(sl.id) AS total_sms_sent
FROM businesses b
LEFT JOIN call_logs cl ON cl.business_id = b.id
LEFT JOIN sms_logs sl ON sl.business_id = b.id
GROUP BY b.id, b.name, b.owner_uid;

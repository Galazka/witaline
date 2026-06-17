ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS internal_cost_pln NUMERIC(10,4) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_internal_cost ON call_logs(internal_cost_pln);

ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT NULL;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS quick_summary TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_call_logs_quality_score ON call_logs(quality_score) WHERE quality_score IS NOT NULL;

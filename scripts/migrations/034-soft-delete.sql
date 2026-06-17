-- 034 — Soft delete dla call_logs i rozmów
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS deleted_by TEXT CHECK (deleted_by IN ('business', 'admin'));

CREATE INDEX IF NOT EXISTS idx_call_logs_deleted ON call_logs(deleted_at);
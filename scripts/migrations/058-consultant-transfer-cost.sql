-- Dodaje brakującą kolumnę kosztu transferu konsultanta do call_logs
-- Używana przez /api/admin/sync-costs do kalkulacji kosztów przekierowania

ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS consultant_transfer_cost_pln NUMERIC(10,4) DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS transferred_to_consultant BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_call_logs_consultant_transfer ON call_logs(consultant_transfer_cost_pln);
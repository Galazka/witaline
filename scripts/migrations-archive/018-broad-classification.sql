-- Drop old CHECK constraint, add broader one
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_classification_check;
ALTER TABLE call_logs ADD CONSTRAINT call_logs_classification_check
  CHECK (classification IN ('spam', 'offer', 'order', 'question', 'booking', 'unknown'));
ALTER TABLE call_logs ALTER COLUMN classification SET DEFAULT 'unknown';

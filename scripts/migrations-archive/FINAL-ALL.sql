-- ================================================================
-- WitaLine - FINALNA MIGRACJA (czerwiec 2026)
-- Wklej do Supabase SQL Editor i uruchom raz
-- ================================================================

-- 1. Rozszerzona klasyfikacja rozmów
UPDATE call_logs SET classification = 'question' WHERE classification = 'inquiry';
UPDATE call_logs SET classification = 'unknown' WHERE classification NOT IN ('question', 'order');
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_classification_check;
ALTER TABLE call_logs ADD CONSTRAINT call_logs_classification_check
  CHECK (classification IN ('spam', 'offer', 'order', 'question', 'booking', 'unknown'));
ALTER TABLE call_logs ALTER COLUMN classification SET DEFAULT 'unknown';

-- 2. Tabela blokad spam
CREATE TABLE IF NOT EXISTS blocked_callers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  reason TEXT DEFAULT '',
  blocked_by TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blocked_callers_phone ON blocked_callers(phone);

-- 3. Kolumna DTMF code dla firm
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS dtmf_code TEXT;

-- ================================================================
-- GOTOWE. Po uruchomieniu: zrestartuj tunel + node scripts/update-tunnel.js
-- ================================================================

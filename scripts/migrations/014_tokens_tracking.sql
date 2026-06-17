-- ============================================================
-- 014 — Token tracking for calls, conversations, businesses
-- Dodaje kolumny do śledzenia tokenów użytych podczas rozmów
-- i konwersacji, oraz miesięcznego limitu tokenów dla firm.
-- ============================================================

-- 1. Tokeny w call_logs (rozmowy telefoniczne ElevenLabs)
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS tokens_input INTEGER DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS tokens_output INTEGER DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS tokens_total INTEGER DEFAULT 0;

-- 2. Tokeny w conversations (czaty + voice widget)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tokens_input INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tokens_output INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tokens_total INTEGER DEFAULT 0;

-- 3. Miesięczne użycie tokenów dla firm (reset monthly)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tokens_used_this_month INTEGER DEFAULT 0;

-- 4. Stwórz indeksy dla szybszych zapytań
CREATE INDEX IF NOT EXISTS idx_call_logs_tokens_total ON call_logs(tokens_total);
CREATE INDEX IF NOT EXISTS idx_conversations_tokens_total ON conversations(tokens_total);
CREATE INDEX IF NOT EXISTS idx_businesses_tokens_used ON businesses(tokens_used_this_month);

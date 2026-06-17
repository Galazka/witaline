-- Add type and message columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'zgloszenie_firmy'
  CHECK (type IN ('zgloszenie_firmy', 'kontakt', 'prosba_o_kontakt', 'spam', 'zamowienie', 'pytanie_o_cene', 'inna'));

ALTER TABLE leads ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '';

-- Allow trashed status
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'processed', 'active', 'trashed'));

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

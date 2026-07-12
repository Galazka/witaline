-- WhatsApp columns for businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_limit INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_used INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_extra_purchased INTEGER DEFAULT 0;

-- Missing total_spent column (migration 013 was never run on this project)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) NOT NULL DEFAULT 0;

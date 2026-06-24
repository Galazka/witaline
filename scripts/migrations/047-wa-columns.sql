-- WhatsApp columns for businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_limit INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_used INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_extra_purchased INTEGER DEFAULT 0;

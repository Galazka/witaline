ALTER TABLE businesses ADD COLUMN IF NOT EXISTS auto_topup_enabled BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS auto_topup_minutes_threshold INTEGER DEFAULT 50;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS auto_topup_sms_threshold INTEGER DEFAULT 20;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS auto_topup_pack_size INTEGER DEFAULT 50;

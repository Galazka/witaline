-- SMS-enabled toggle for businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT true;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS sms_disabled_by_admin BOOLEAN DEFAULT false;

-- Prefer not to have both true
CREATE OR REPLACE FUNCTION check_sms_enabled()
RETURNS trigger AS $$
BEGIN
  IF NEW.sms_disabled_by_admin THEN
    NEW.sms_enabled := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_sms_enabled ON businesses;
CREATE TRIGGER trg_check_sms_enabled
  BEFORE INSERT OR UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION check_sms_enabled();

-- Update existing rows
UPDATE businesses SET sms_enabled = true WHERE sms_enabled IS NULL;
UPDATE businesses SET sms_disabled_by_admin = false WHERE sms_disabled_by_admin IS NULL;
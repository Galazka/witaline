-- Atomic sms_used increment function
CREATE OR REPLACE FUNCTION increment_sms_used(biz_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE businesses
  SET sms_used = COALESCE(sms_used, 0) + 1
  WHERE id = biz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set default values for existing rows
UPDATE businesses SET sms_limit = COALESCE(sms_limit, 0), sms_used = COALESCE(sms_used, 0), sms_extra_purchased = COALESCE(sms_extra_purchased, 0);

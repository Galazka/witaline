-- RPC functions for coupon/discount usage tracking

CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_discount_rule_usage(rule_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE discount_rules SET used_count = used_count + 1 WHERE id = rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

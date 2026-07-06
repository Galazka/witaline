-- 033 — Update CHECK constraint for new pricing plans
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_current_plan_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_current_plan_check
  CHECK (current_plan IN ('start_100', 'pro_500', 'enterprise_2000', 'elastic_0', 'pro_249', 'lux_599'));
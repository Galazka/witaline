-- Minutes rollover system
-- Niewykorzystane minuty przechodzą na kolejny miesiąc (kumulują się)
-- Maksymalny cap: 2x miesięcznego limitu

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS rollover_minutes INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rollover_max_cap INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS minutes_used_this_month INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_rollover_at TIMESTAMPTZ;

-- Add rollover_logs table
CREATE TABLE IF NOT EXISTS rollover_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_limit INTEGER NOT NULL,
  minutes_used INTEGER NOT NULL,
  rollover_added INTEGER NOT NULL,
  rollover_before INTEGER NOT NULL,
  rollover_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rollover_logs_business ON rollover_logs(business_id, created_at DESC);

-- Function: calculate rollover at end of billing period
CREATE OR REPLACE FUNCTION calculate_monthly_rollover(p_business_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_plan_limit INTEGER;
  v_used INTEGER;
  v_unused INTEGER;
  v_current_rollover INTEGER;
  v_max_cap INTEGER;
  v_add INTEGER;
BEGIN
  -- Get plan limits from pricing config
  SELECT COALESCE(b.monthly_voice_minutes, 0) INTO v_plan_limit
  FROM businesses b WHERE b.id = p_business_id;
  
  SELECT COALESCE(b.minutes_used_this_month, 0), COALESCE(b.rollover_minutes, 0), COALESCE(b.rollover_max_cap, 0)
  INTO v_used, v_current_rollover, v_max_cap
  FROM businesses b WHERE b.id = p_business_id;
  
  -- If no plan limit or pay-per-use, no rollover
  IF v_plan_limit <= 0 THEN
    RETURN 0;
  END IF;
  
  v_unused := GREATEST(0, v_plan_limit - v_used);
  
  -- Cap at 2x monthly limit by default
  IF v_max_cap <= 0 THEN
    v_max_cap := v_plan_limit * 2;
  END IF;
  
  v_add := LEAST(v_unused, v_max_cap - v_current_rollover);
  v_add := GREATEST(0, v_add);
  
  -- Update business
  UPDATE businesses
  SET rollover_minutes = v_current_rollover + v_add,
      minutes_used_this_month = 0,
      last_rollover_at = now()
  WHERE id = p_business_id;
  
  -- Log it
  INSERT INTO rollover_logs (business_id, plan_limit, minutes_used, rollover_added, rollover_before, rollover_after)
  VALUES (p_business_id, v_plan_limit, v_used, v_add, v_current_rollover, v_current_rollover + v_add);
  
  RETURN v_add;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

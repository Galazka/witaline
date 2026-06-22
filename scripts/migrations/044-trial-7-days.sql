-- ============================================================
-- WitaLine — Set trial period to 7 days
-- Changes default trial_ends_at from 14 days to 7 days
-- Updates existing businesses that are still trialing
-- ============================================================

-- Update default for new businesses
ALTER TABLE businesses ALTER COLUMN trial_ends_at SET DEFAULT now() + interval '7 days';

-- Shorten existing trials for businesses still in trial period
UPDATE businesses
SET trial_ends_at = LEAST(trial_ends_at, created_at + interval '7 days')
WHERE subscription_status = 'trialing'
  AND trial_ends_at > created_at + interval '7 days';

-- Verify
SELECT '044-trial-7-days migration complete' AS status;

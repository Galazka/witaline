-- ============================================================
-- 013 — Add subscription_current_period_end to businesses
-- Przechowuje datę zakończenia bieżącego okresu subskrypcji
-- (z Stripe: subscription.current_period_end)
-- ============================================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ DEFAULT NULL;

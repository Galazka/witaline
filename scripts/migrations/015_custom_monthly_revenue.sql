-- ============================================================
-- 015 — Add custom_monthly_revenue to businesses
-- Pozwala adminowi ustawić indywidualną cenę/rabat dla firmy
-- (np. 199 zamiast 299 za Start)
-- NULL = standardowa cena z PLAN_REVENUE
-- ============================================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS custom_monthly_revenue DECIMAL(10,2) DEFAULT NULL;

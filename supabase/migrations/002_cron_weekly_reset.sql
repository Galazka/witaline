-- WitaLine - Cron: tygodniowy reset minut

-- Wymaga włączenia pg_cron w Supabase:
-- SQL Editor → "create extension pg_cron"

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Funkcja resetująca minutes_used_this_week dla wszystkich firm
CREATE OR REPLACE FUNCTION reset_weekly_minutes()
RETURNS void AS $$
BEGIN
  UPDATE businesses
  SET minutes_used_this_week = 0;
END;
$$ LANGUAGE plpgsql;

-- Harmonogram: co poniedziałek 00:00 CET
-- W Supabase cron działa w strefie UTC, więc 00:00 CET = 23:00 UTC (winter) / 22:00 UTC (summer)
SELECT cron.schedule(
  'reset-weekly-minutes',     -- nazwa zadania
  '0 23 * * 1',              -- co poniedziałek 23:00 UTC = 00:00 CET
  'SELECT reset_weekly_minutes();'
);

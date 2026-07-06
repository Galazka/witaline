# WitaLine — Lista zadań

Stan na: 2026-07-03

---

## Priorytet 1 — Stabilność ✅

- [x] **Store Twilio call SID** — dodano `twilio_call_sid` do dynamic_vars w registerCall() + registerTransferFallback(); fallback `call_sid` w call-completed
- [x] **Cleanup active_calls** — dodano cleanup przy każdym setActiveCallSid + cron `/api/cron/cleanup-active-calls` co 2h
- [x] **Wyłączyć `ignoreBuildErrors`** — usunięto z next.config.ts (build przechodzi czysto)

## Priorytet 2 — Testy ✅

- [x] **Testy integracyjne dla MCP** — 7 testów: GET, parse error, unknown method, tools/list (8 tooli), initialize, tools/call unknown tool, prefix stripping
- [x] **Testy sync-costs** — 2 testy: 401 bez auth, poprawne statystyki
- [x] **Testy AdminRealCosts/AdminDailyCosts** — 13 testów (7 AdminRealCosts + 6 AdminDailyCosts), jsdom + @testing-library/react, per-file `// @vitest-environment jsdom`

## Priorytet 3 — DB & Infra ✅

- [x] **Zunifikować migracje DB** — `supabase/migrations/000_reference.sql` = full current schema (46 tabel, idempotentny); `scripts/migrations/` → `scripts/migrations-archive/`; zweryfikowano na produkcji przez Supabase SQL
- [x] **Uruchomiono migrację na produkcji** — dodano brakujące kolumny (call_logs: 41, businesses: 49, conversations: 6), utworzono brakujące tabele (balance_topups, business_quick_replies, number_purchases), założono indeksy, funkcje, triggery, cron, RLS, seed data

## Priorytet 3 — Uzupełnienia

- [x] **Posprzątać puste tabele** — `audit_logs` (duplikat `audit_log`) usunięty; pozostałe (`integration_logs`, `pending_transfers`, `wa_logs`) mają kod → zostają; uwaga: `wa_logs` to pozostałość po WhatsApp (usuniętym), kod w real-costs/reset-stats nadal go używa
- [x] **Dodać backup DB** — `scripts/backup-db.ps1` (pg_dump przez supabase CLI), wpis cron w railway.json (codziennie 4:00)
- [x] **Automatyczny sync-costs po każdym call-completed** — dodano `syncCallCosts()` w route.ts, fire-and-forget po zapisie call_log, pobiera ElevenLabs conversation API z billingiem
- [x] **Konfiguracja Sentry** — dodano do `.env.local`; Railway: ustawić ręcznie `SENTRY_AUTH_TOKEN` w dashboardzie (MCP wymaga reloginu)
- [ ] **Supabase CLI login** — `supabase login` + `supabase link` + `supabase db pull` dla CLI tracking

## Priorytet 4 — Monitoring

- [ ] **Alert przy niskim saldzie ElevenLabs / Twilio** — obecnie tylko klientom, nie wewnętrznie
- [ ] **Dashboard kosztów** — koszty ElevenLabs + Twilio w czasie rzeczywistym
- [ ] **Logi błędów sync-costs** — wyświetlić w admin panelu (obecnie tylko console.warn)

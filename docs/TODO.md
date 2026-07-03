# WitaLine — Lista zadań

Stan na: 2026-07-02

---

## Priorytet 1 — Stabilność ✅

- [x] **Store Twilio call SID** — dodano `twilio_call_sid` do dynamic_vars w registerCall() + registerTransferFallback(); fallback `call_sid` w call-completed
- [x] **Cleanup active_calls** — dodano cleanup przy każdym setActiveCallSid + cron `/api/cron/cleanup-active-calls` co 2h
- [x] **Wyłączyć `ignoreBuildErrors`** — usunięto z next.config.ts (build przechodzi czysto)

## Priorytet 2 — Testy

- [ ] **Testy integracyjne dla MCP** — najważniejszy endpoint biznesowy
- [ ] **Testy sync-costs** — krytyczne dla poprawności kosztów
- [ ] **Testy AdminRealCosts/AdminDailyCosts** — skomplikowana logika agregacji

## Priorytet 3 — Uzupełnienia

- [ ] **Zunifikować migracje DB** — przenieść wszystko do `supabase/migrations/` z README o aktualnym stanie
- [ ] **Posprzątać puste tabele** — usunąć nieużywane lub udokumentować cel
- [ ] **Dodać backup DB** — skrypt/cron do zrzutu bazy
- [ ] **Automatyczny sync-costs po każdym call-completed** — zamiast ręcznego
- [ ] **Konfiguracja Sentry** — dodać `SENTRY_AUTH_TOKEN` do Railway env

## Priorytet 4 — Monitoring

- [ ] **Alert przy niskim saldzie ElevenLabs / Twilio** — obecnie tylko klientom, nie wewnętrznie
- [ ] **Dashboard kosztów** — koszty ElevenLabs + Twilio w czasie rzeczywistym
- [ ] **Logi błędów sync-costs** — wyświetlić w admin panelu (obecnie tylko console.warn)

## Priorytet 2 — Testy

- [ ] **Testy integracyjne dla MCP** — najważniejszy endpoint biznesowy
- [ ] **Testy sync-costs** — krytyczne dla poprawności kosztów
- [ ] **Testy AdminRealCosts/AdminDailyCosts** — skomplikowana logika agregacji

## Priorytet 3 — Uzupełnienia

- [ ] **Zunifikować migracje DB** — przenieść wszystko do `supabase/migrations/` z README o aktualnym stanie
- [ ] **Posprzątać puste tabele** — usunąć nieużywane lub udokumentować cel
- [ ] **Dodać backup DB** — skrypt/cron do zrzutu bazy
- [ ] **Automatyczny sync-costs po każdym call-completed** — zamiast ręcznego
- [ ] **Konfiguracja Sentry** — dodać `SENTRY_AUTH_TOKEN` do Railway env

## Priorytet 4 — Monitoring

- [ ] **Alert przy niskim saldzie ElevenLabs / Twilio** — obecnie tylko klientom, nie wewnętrznie
- [ ] **Dashboard kosztów** — koszty ElevenLabs + Twilio w czasie rzeczywistym
- [ ] **Logi błędów sync-costs** — wyświetlić w admin panelu (obecnie tylko console.warn)

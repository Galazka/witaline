<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# WitaLine — Session Context (June 2026)

## Goal
Polish B2B SaaS platform "WitaLine" — automatyczna recepcja AI. Telephony IVR, call logging, admin panel, ElevenLabs ConvAI, Twilio, OpenRouter.

## Stack
- Next.js 16 App Router, Tailwind CSS (brand green #3CBF4A), Supabase (PostgreSQL), OpenRouter, ElevenLabs ConvAI (STT/TTS), Twilio (+48732125752), Stripe, Resend
- PL + EN (i18n przez moduł)

## Key Files
- `src/lib/twilio-utils.ts` — `connectToAgent()` via register-call with overrides, falls back to `<Conversation>`
- `src/app/api/twilio/spam-filter/route.ts` — spam check → connectToAgent()
- `src/app/api/elevenlabs/call-completed/route.ts` — webhook handler, WhatsApp continuity, SMS
- `src/app/api/elevenlabs/client-data/route.ts` — returns voice_id Maja, first_message, prompt
- `src/app/api/elevenlabs/transfer-human/route.ts` — `transfer_to_human` endpoint
- `src/app/api/twilio/human-handoff/route.ts` — sekwencyjne dzwonienie (DTMF + konsultanci)
- `src/app/api/twilio/human-handoff/next/route.ts` — kolejny konsultant po timeout
- `src/app/api/twilio/whatsapp/route.ts` — incoming WhatsApp webhook
- `src/lib/twilio-whatsapp.ts` — WhatsApp send utility + szablony
- `src/lib/twilio-sms.ts` — SMS send utility
- `src/lib/i18n.ts` — tłumaczenia PL/EN
- `src/lib/pricing.ts` — token-based pricing: 299/599/1199 PLN
- **MCP**: `src/lib/mcp/server.ts` — serwer MCP z 8 narzędziami
- **MCP**: `src/lib/mcp/tools.ts` — definicje narzędzi (z Zod schema)
- **MCP**: `src/lib/mcp/handlers.ts` — handlery (fetch do wewnętrznych API)
- **MCP**: `src/app/api/mcp/route.ts` — endpoint JSON-RPC (direct handler, 9 tooli)
- `scripts/start.js` — **skrypt startowy**: uruchamia dev server + tunnel + auto-konfiguracja jednym poleceniem
- `witaline-config.json` — **plik konfiguracyjny** z aktualnym tunelem, MCP ID, agent ID
- `src/components/VoiceAgent.tsx` — widget audio
- `src/components/PricingSection.tsx` — sekcja cennika
- `src/components/ConsultantListManager.tsx` — lista konsultantów
- `src/components/CallTable.tsx` — tabela połączeń z badge handoff + quality_score badge
- `src/lib/analyze-call.ts` — OpenRouter call quality scorer (GPT-4o-mini, 1-10 score + one-line PL summary)
- `src/components/AdminPortRequests.tsx` — zarządzanie port requestami
- `src/components/layout/Sidebar.tsx` — sidebar z submenu
- `src/components/layout/TopNav.tsx` — top bar z notyfikacjami + user
- `src/components/layout/AdminLayout.tsx` — AdminLayout shell (sidebar + topnav + context) + admin tabs
- `src/components/layout/DashboardLayout.tsx` — DashboardLayout shell (sidebar + topnav + context) + dashboard tabs
- `src/app/admin/layout.tsx` — wraps admin pages w/ AdminLayoutShell
- `src/app/dashboard/layout.tsx` — wraps dashboard pages w/ DashboardLayoutShell
- `scripts/setup-tunnel.js` — skrypt aktualizujący URL tunelu (MCP + webhooki + Twilio)
- `scripts/register-human-handoff-tool.js` — rejestracja toola (wykonany, niepotrzebny)
- `scripts/migrations/*.sql` — migracje SQL
- `RUN-MIGRATION.sql` — kompleksowa migracja SQL

## Critical Config
- **Tunnel**: https://arizona-minutes-notification-chronicles.trycloudflare.com
- **Agent ID**: agent_1501krvm9y90e549tyg96mgczsfv ("Rob", voice Maja: tWVHsc0fuVfAZWfScX9a)
- **ElevenLabs TTS**: expressive_mode=false, stability=0.7, similarity_boost=0.75, style=0.0
- **ElevenLabs ASR keywords**: polskie liczebniki + business terms
- **Webhook**: POST /api/elevenlabs/call-completed
- **Webhook secret**: wsec_dc9eb186396aab40f61bf83e3ab652d6147b38da625f83580887ab0b91693321
- **Post-call webhook**: aktywny (workspace webhook, ID: 90ec0487bdfd402584a4a1c67292f040)
- **Main line business**: 00000000-0000-0000-0000-000000000001 (WitaLine linia główna)
- **Twilio voice URL**: https://arizona-minutes-notification-chronicles.trycloudflare.com/api/twilio/spam-filter
- **Agent tools**: MCP server `witaline-tools` (ID: h36suSdSvQaylNdUh2Uy) — 9 narzędzi: business_lookup, save_lead, check_availability, create_reservation, get_services, get_business_hours, send_whatsapp, transfer_to_human, create_checkout
- **MCP transport**: JSON-RPC direct handler (no SDK), auto_approve_all
- **allowedDevOrigins**: `["*"]` w next.config.ts (dev tunnel HMR)
- **Healthcheck**: ✅ success (port 3000 hardcoded, Railway proxy configured accordingly)

## Call Flow
1. Twilio → `/api/twilio/spam-filter` → spam check → `connectToAgent()` → `registerCall()` z `dynamic_vars.business_id`
2. ElevenLabs agent rozmawia → może wywołać tool-e przez MCP (business_lookup, save_lead, kalendarz, send_whatsapp, transfer_to_human)
3. Call ends → ElevenLabs POSTs to /api/elevenlabs/call-completed → saves call_logs, SMS/WhatsApp continuity, notifications

## Pricing (2026-06)
- **Model elastyczny (pay-as-you-go)**: brak opłat stałych, progresja cenowa:
  - 0–500 min: 1,20 PLN/min | 501–1000: 1,10 | 1001–2000: 1,00 | 2001–3000: 0,95 | 3001–5000: 0,90 | 5001+: 0,85 PLN/min
- Klient kupuje pakiety minut przez Stripe (one-time), doładowuje w każdej chwili. Minuty ważne bezterminowo, potrącane z `prepaid_minutes` w `call-completed`.
- **Stripe**: `/api/stripe/buy-minutes` tworzy sesję `mode:payment` z dynamiczną ceną. Webhook dodaje minuty do salda.
- **Stripe**: `/api/stripe/buy-minutes` tworzy sesję `mode:payment` z dynamiczną ceną. Webhook dodaje minuty do salda.

## WhatsApp Continuity
- **sendWhatsApp()** w `twilio-whatsapp.ts` — wysyła przez Twilio WhatsApp API (sandbox +14155238886)
- **Szablony**: booking, order, offer, payment_reminder, default
- **Webhook incoming**: `/api/twilio/whatsapp` — zapisuje do wa_logs + auto-reply + powiadomienie
- **call-completed**: wysyła WhatsApp continuity po rozmowie (jeśli wa_consent + wa_phone)
- **send_whatsapp tool**: ElevenLabs agent może wysłać WhatsApp w trakcie rozmowy
- **Tabela**: `wa_logs` + kolumny `wa_limit/wa_used/wa_extra_purchased/whatsapp_number` w `businesses`

## Known Issues
- Cloudflare tunnel zmienia URL przy każdym restarcie → uruchom `node scripts/start.js` (automatycznie restartuje wszystko). Możesz też ręcznie: `node scripts/setup-tunnel.js https://nowy-tunel.trycloudflare.com` — skrypt aktualizuje .env, MCP server URL, webhooki agenta i Twilio.
- **`transfer_to_number` disabled**: narzędzie nie działa dla zewnętrznych numerów - wyłączone w konfiguracji agenta
- **Webhook secret mismatch**: call-completed akceptuje żądanie nawet przy błędnym secret (debug mode)
- **Client-data webhook**: nieustawiony po update-tunnel-url — ustawić ręcznie w dashboardzie ElevenLabs
- **HMR WebSocket**: może nie działać przez Cloudflare tunnel → Ctrl+Shift+R lub restart dev servera
- **Twilio Subaccounts**: obsługa wielodzierżawców, SID podaje się w `TWILIO_ACCOUNT_SID` dla każdego biznesu (konfiguracja w panelu admina)
- **Railway healthcheck**: ✅ resolved — port hardcoded to 3000 in start script, Railway proxy port set to 3000

## Recent Changes (June 24-25, 2026)
- **Registration fix**: text colors on dark background (changed `text-zinc-900`/`text-zinc-700` → `text-white`/`text-white/80`) w `src/app/(marketing)/register/page.tsx`
- **Business categories**: added 15 new kategorii (Adwokat, Kancelaria, Restauracja, Hotel, etc.) w `src/lib/templates.ts`
- **Dashboard crash fix**: added `elastic_0` and `enterprise_2000` to `plans` object w `src/lib/pricing.ts` + `getPlanConfig()` checks direct plan key match first
- **Dashboard error.tsx**: improved UX — detail toggle, refresh link, error message display
- **MCP tools via ElevenLabs UI**: agent ma już przypisane narzędzia MCP (widoczne w dashboardzie ElevenLabs) — `transfer_to_human` z `caller_phone: optional`

## To Do
- [x] **Run `RUN-MIGRATION.sql`** w Supabase SQL Editor ✅
- [x] **Przypisz webhook do agenta** w ElevenLabs dashboard ✅
- [x] **Włącz client-data webhook** w ElevenLabs dashboard ✅
- [x] **WhatsApp Continuity** — utility + webhook + call-completed + tool ✅
- [x] **8 tooli agenta przez MCP** — business_lookup, save_lead, kalendarz, send_whatsapp, transfer_to_human ✅
- [x] **MCP server** — Streamable HTTP, auto_approve_all, 1 endpoint zamiast 8 webhook tooli ✅
- [x] **Redesign admin layout** — Sidebar + TopNav + context + layout.tsx ✅
- [x] **Redesign dashboard layout** — Sidebar + TopNav + context + layout.tsx ✅
- [x] **Redesign landing page** — nowy hero, trust bar, problem→solution, cleaner sections ✅
- [x] **Przywrócić pełne sekcje dashboardu** (reservations, sms, leads, voice) ✅
- [x] **Call quality scoring** — OpenRouter GPT-4o-mini, quality_score + quick_summary w call_logs, badge w CallTable ✅
- [x] **Twilio Subaccounts** — DB migration, helper, create-subaccount API, admin UI, per-business creds w twilio-utils/sms/whatsapp ✅
- [x] **SEO — sitemap, robots, JSON-LD, metadata** ✅
- [x] **Server-side auth proxy** (Next.js 16 proxy.ts) ✅
- [x] **Error/loading/not-found boundaries** ✅
- [x] **Webhook secret fix — prawdziwa walidacja** ✅
- [x] **Design system redesign** — agency-grade globals.css ✅
- [x] **Admin/Dashboard layout redesign** — sidebar, topnav, layout ✅
- [x] **Landing page redesign** — nav, hero, footer premium look ✅
- [x] **CI/CD GitHub Actions** — build + typecheck ✅
- [x] **Sentry User Feedback widget** ✅
- [x] **README** — pełna dokumentacja build/deploy ✅
- [x] **Registration text colors + categories** ✅
- [x] **Regulamin cleanup**: removed subscription plans, rollover section, stale pricing ✅
- [x] **Maja system prompt**: elastic-only pricing, transfer only on request, WitaLine knowledge ✅
- [x] **Tomek consultant**: +48790824762 added to DB + .env ✅
- [ ] **Test end-to-end**: zadzwoń na +48 732 125 752, sprawdź DB
- [x] **Language Detection** — already enabled in agent Rob (built_in_tools.language_detection) ✅
- [x] **Dashboard**: plan key fix verified (`elastic_0`/`enterprise_2000` w `plans` + `getPlanConfig()`) ✅
- [x] **Maja system prompt** — zaktualizowany przez ElevenLabs API (2124 znaki, wielojęzyczny, WitaLine-first, NIGDY nie pytaj o numer) ✅
- [x] **Admin sync-costs**: dodany `deleted_at` filter, wypchnięte na main ✅
- [x] **AccountBalance**: try/catch dla brakujących kolumn wa_* + migracja 047 ✅
- [x] **Dashboard blank fix**: IntersectionObserver useEffect dodana zależność `business` — ref był nullem na mount ✅
- [x] **Transfer fix**: usunięty broken Twilio REST redirect (nie działał na aktywnej rozmowie ElevenLabs). Agent po `transfer_to_human` KONIECZNIE kończy rozmowę → Twilio Redirect → transfer-router łączy z konsultantem przez `<Enqueue>` + `<Dial>` ✅
- [x] **Maja prompt aktualizacja**: dodana instrukcja "PO UDANYM PRZEKAZANIU KONIECZNIE zakoncz rozmowe" + sekcja JAK DZIALA TRANSFER (2485 znaków) ✅
- [x] **conversation-store.ts**: in-memory store (callSid → convId) dla potencjalnego ElevenLabs transfer API ✅

## OpenClaw / Hermes Integration

### OpenClaw (https://openclaw.ai)
Open-source personal AI assistant. Local-first gateway, multi-channel (WhatsApp, Telegram, Discord, Signal, etc.), voice I/O via ElevenLabs, skills/plugins.

**Integration with WitaLine:**
1. **Webhook bridge** — OpenClaw can POST to WitaLine webhook endpoints (e.g., `/api/external/incoming`) to trigger calls or send WhatsApp/SMS via WitaLine's Twilio infrastructure.
2. **MCP client** — OpenClaw can consume WitaLine's MCP JSON-RPC endpoint (`/api/mcp`) as an external tool provider, giving its agents access to `business_lookup`, `save_lead`, `create_reservation`, etc.
3. **Voice handoff** — WitaLine's ElevenLabs agent can transfer complex conversations to an OpenClaw instance via webhook for specialized handling.

### Hermes Agent (https://github.com/NousResearch/hermes-agent)
CLI-first AI agent by Nous Research with voice mode, messaging gateways (Telegram, Discord, WhatsApp, Signal), skills, memory, cron.

**Integration with WitaLine:**
1. **Gateway plugin** — Hermes can register WitaLine as a messaging channel via Hermes' plugin system, allowing voice calls handled by WitaLine to appear in Hermes conversations.
2. **Tool provider** — WitaLine MCP tools exposed as Hermes-compatible skills.
3. **Voice mode** — Hermes' ElevenLabs TTS provider can use WitaLine's voice configuration.

### Quick Start
```bash
# OpenClaw
openclaw skills install voiceclaw          # Local voice I/O
openclaw channel add webhook               # Add WitaLine webhook

# Hermes
hermes skills install witaline-tools       # Install WitaLine MCP tools (when published)
hermes config set channels.witaline.enabled true
```

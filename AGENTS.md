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
- `src/components/CallTable.tsx` — tabela połączeń z badge handoff
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

## Call Flow
1. Twilio → `/api/twilio/spam-filter` → spam check → `connectToAgent()` → `registerCall()` z `dynamic_vars.business_id`
2. ElevenLabs agent rozmawia → może wywołać tool-e przez MCP (business_lookup, save_lead, kalendarz, send_whatsapp, transfer_to_human)
3. Call ends → ElevenLabs POSTs to /api/elevenlabs/call-completed → saves call_logs, SMS/WhatsApp continuity, notifications

## Pricing (2026-06 — konkurencyjne stawki)
- Elastic (pakietowy): 1.49 → 0.99 PLN/min (50-5000 min, 5 progów)
- Start: 199 PLN/mies (250 min)
- Pro: 249 PLN/mies (300 min)
- Growth: 399 PLN/mies (600 min) — najpopularniejszy
- Lux: 599 PLN/mies (800 min)
- Enterprise: 999 PLN/mies (1500 min)
- **Model pakietowy**: klient kupuje pakiety minut przez Stripe (one-time), doładowuje w każdej chwili. Minuty potrącane z `prepaid_minutes` w `call-completed`.
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
- [ ] **Test end-to-end**: zadzwoń na +48 732 125 752, sprawdź DB
- [ ] **Włączyć Language Detection** w agent "Rob" → system tools
- [ ] Add Twilio Subaccounts for multi-tenancy

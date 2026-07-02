# WitaLine — Automatyczna Recepcja AI 24/7

Platforma B2B SaaS, która zastępuje tradycyjną recepcję asystentem głosowym AI. Oparty na ElevenLabs ConvAI system odbiera połączenia przez Twilio, przyjmuje zamówienia, umawia wizyty i odpowiada na pytania klientów — 24 godziny na dobę, 7 dni w tygodniu, w języku polskim i angielskim.

---

## Stack technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Frontend / Backend | Next.js 16 (App Router), TypeScript, React 19 |
| Stylowanie | Tailwind CSS 4, marka zielona `#3CBF4A` |
| Baza danych | Supabase (PostgreSQL + Auth + Row Level Security) |
| Telefonia | Twilio (voice, SIP, SMS, WhatsApp API) |
| Agent głosowy | ElevenLabs ConvAI (STT/TTS, conversational agent) |
| Scorowanie rozmów | OpenRouter (GPT-4o-mini, quality score 1-10) |
| Płatności | Stripe (Checkout, Webhook, Customer Portal) |
| Emaile | Resend (transakcyjne, reminders, weekly summary) |
| Monitoring błędów | Sentry |
| MCP | Własny serwer MCP (Streamable HTTP, 9 narzędzi) |
| Tunneling | Cloudflare Tunnel (dev) |
| Deploy | Railway (Nixpacks) |
| Cron | Vercel Cron Jobs / Railway cron |

---

## Wymagania

- **Node.js** 18+
- **npm** (lub pnpm/yarn)
- Konto w serwisach: Supabase, Twilio, ElevenLabs, Stripe, OpenRouter, Resend

---

## Szybki start

```bash
# 1. Sklonuj repozytorium
git clone <repo-url>
cd witaline

# 2. Zainstaluj zależności
npm install

# 3. Skopiuj i wypełnij zmienne środowiskowe
cp .env.example .env
```

Wymagane zmienne w `.env`:

| Zmienna | Opis |
|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projektu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Główny numer telefonu |
| `ELEVENLABS_API_KEY` | Klucz API ElevenLabs |
| `ELEVENLABS_AGENT_ID` | ID agenta ConvAI |
| `ELEVENLABS_WEBHOOK_SECRET` | Secret dla webhooków |
| `OPENROUTER_API_KEY` | Klucz API OpenRouter |
| `STRIPE_SECRET_KEY` | Secret key Stripe |
| `STRIPE_WEBHOOK_SECRET` | Signing secret webhooka Stripe |
| `RESEND_API_KEY` | Klucz API Resend |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | DSN Sentry |

```bash
# 4a. Szybki start (dev server + Cloudflare tunnel + auto-konfiguracja)
node scripts/start.js

# 4b. Albo ręcznie
npm run dev          # Dev server na http://localhost:3000
npx cloudflared tunnel --url http://localhost:3000   # (oddzielny terminal)
```

Skrypt `start.js` automatycznie:
- Zabija stare procesy na porcie 3000
- Uruchamia Next.js dev server
- Uruchamia cloudflared tunnel
- Wykrywa URL tunelu i aktualizuje konfigurację (webhooki ElevenLabs, Twilio voice URL, MCP server URL)
- Zapisuje stan do `witaline-config.json`

---

## Skrypty

| Komenda | Opis |
|---------|------|
| `npm run dev` | Dev server na `localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Production server (`-H 0.0.0.0 -p ${PORT:-3000}`) |
| `npm run lint` | ESLint (Next.js lint) |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |
| `node scripts/start.js` | Dev + tunnel + auto-konfiguracja (wszystko w jednym) |
| `node scripts/setup-tunnel.js <url>` | Aktualizacja URL tunelu w konfiguracji |

---

## Struktura projektu

```
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing page (server)
│   │   ├── home-page.tsx             # Landing page UI (client)
│   │   ├── layout.tsx                # Root layout + metadata + JSON-LD
│   │   ├── error.tsx                 # Global error boundary
│   │   ├── loading.tsx               # Global loading state
│   │   ├── not-found.tsx             # 404
│   │   ├── sitemap.ts / robots.ts    # SEO
│   │   ├── proxy.ts                  # Auth proxy (Next.js 16)
│   │   │
│   │   ├── login/                    # Logowanie
│   │   ├── register/                 # Rejestracja
│   │   ├── admin/                    # Panel administracyjny
│   │   │   ├── layout.tsx            # AdminLayout shell
│   │   │   ├── page.tsx              # Dashboard admina
│   │   │   ├── conversations/        # Podgląd rozmów
│   │   │   └── ...
│   │   ├── dashboard/                # Panel klienta
│   │   │   ├── layout.tsx            # DashboardLayout shell
│   │   │   └── page.tsx              # Dashboard klienta
│   │   ├── blog/                     # Blog (SSG)
│   │   └── api/                      # API routes
│   │       ├── elevenlabs/           # Webhooki ElevenLabs ConvAI
│   │       │   ├── call-completed/   # Zakończenie rozmowy
│   │       │   ├── client-data/      # Konfiguracja agenta na start
│   │       │   ├── transfer-human/   # Transfer do konsultanta
│   │       │   ├── business-lookup/  # Wyszukiwanie firmy
│   │       │   ├── save-lead/        # Zapis leada
│   │       │   ├── check-availability/   # Sprawdzenie dostępności
│   │       │   ├── create-reservation/   # Tworzenie rezerwacji
│   │       │   ├── get-services/     # Lista usług
│   │       │   ├── get-business-hours/   # Godziny otwarcia
│   │       │   ├── send-whatsapp/    # Wysyłka WhatsApp
│   │       │   ├── conversations/    # Historia rozmów
│   │       │   ├── token/           # Token konwersacji (widget)
│   │       │   ├── tts/            # Testowe TTS
│   │       │   └── clone-voice/    # Klonowanie głosu
│   │       ├── twilio/               # Webhooki Twilio
│   │       │   ├── incoming/         # Główne połączenie przychodzące
│   │       │   ├── spam-filter/      # Filtrowanie spamu
│   │       │   ├── connect/          # Connect to agent
│   │       │   ├── human-handoff/    # Sekwencyjne dzwonienie
│   │       │   ├── human-handoff/next/   # Kolejny konsultant
│   │       │   ├── whatsapp/         # WhatsApp webhook
│   │       │   ├── ivr-menu/         # Menu IVR
│   │       │   ├── ivr-callback/     # Callback z IVR
│   │       │   ├── voicemail/        # Poczta głosowa
│   │       │   ├── transfer-router/  # Router transferów
│   │       │   ├── conference-status/    # Status konferencji
│   │       │   ├── recording-status/ # Status nagrania
│   │       │   ├── port-request/     # Port request numeru
│   │       │   ├── search-numbers/   # Wyszukiwarka numerów
│   │       │   ├── purchase-number/  # Zakup numeru
│   │       │   └── join-conference/  # Dołączanie do konferencji
│   │       ├── stripe/               # Stripe webhooki
│   │       │   ├── webhook/          # Stripe webhook
│   │       │   ├── checkout/         # Stripe Checkout session
│   │       │   ├── buy-minutes/      # Zakup pakietu minut
│   │       │   ├── buy-sms/          # Zakup pakietu SMS
│   │       │   ├── portal/           # Customer Portal
│   │       │   └── status/           # Status płatności
│   │       ├── mcp/                  # MCP JSON-RPC endpoint
│   │       ├── health/               # Healthcheck
│   │       ├── business/             # API biznesowe
│   │       ├── calendar/             # Google Calendar OAuth
│   │       ├── reservations/         # Rezerwacje
│   │       ├── leads/                # Lead management
│   │       ├── conversations/        # Konwersacje
│   │       ├── cron/                 # Cron jobs
│   │       ├── onboarding/           # Proces onboardingu
│   │       ├── widget/               # Publiczny widget embed
│   │       ├── chat/                 # Chat z konsultantem
│   │       └── ...                   # Pozostałe API
│   │
│   ├── components/                   # React komponenty
│   │   ├── layout/                   # System layoutu
│   │   │   ├── AdminLayout.tsx       # Shell panelu admina
│   │   │   ├── DashboardLayout.tsx   # Shell panelu klienta
│   │   │   ├── Sidebar.tsx           # Sidebar z submenu
│   │   │   └── TopNav.tsx            # Górny pasek
│   │   ├── CallTable.tsx             # Tabela połączeń + quality score
│   │   ├── PricingSection.tsx        # Sekcja cennika
│   │   ├── SavingsCalculator.tsx     # Kalkulator oszczędności
│   │   ├── ConsultantListManager.tsx # Zarządzanie konsultantami
│   │   ├── VoiceAgent.tsx            # Widget audio agenta
│   │   ├── FloatingWidget.tsx        # Float widget na stronie
│   │   ├── AdminPortRequests.tsx     # Port requesty w adminie
│   │   └── ...
│   │
│   ├── lib/                          # Utilities i logika biznesowa
│   │   ├── supabase.ts              # Browser client Supabase
│   │   ├── supabase-server.ts       # Server client Supabase
│   │   ├── supabase-admin.ts        # Admin client (service role)
│   │   ├── pricing.ts              # Logika cenowa (plany + elastic)
│   │   ├── twilio-utils.ts         # Helpery Twilio (connectToAgent, registerCall)
│   │   ├── twilio-sms.ts           # Wysyłka SMS przez Twilio
│   │   ├── twilio-whatsapp.ts      # Wysyłka WhatsApp + szablony
│   │   ├── i18n.ts                 # Internacjonalizacja PL/EN
│   │   ├── analyze-call.ts         # Scorowanie rozmów (OpenRouter)
│   │   ├── mcp/
│   │   │   ├── server.ts           # MCP server (Streamable HTTP)
│   │   │   ├── tools.ts            # Definicje narzędzi (Zod)
│   │   │   └── handlers.ts         # Handlery narzędzi
│   │   └── ...
│   │
│   ├── hooks/                        # Custom React hooks
│   ├── types/                        # TypeScript typy
│   └── proxy.ts                      # Next.js 16 proxy auth
│
├── scripts/                          # Skrypty pomocnicze
│   ├── start.js                     # Dev + tunnel + auto-konfiguracja
│   ├── setup-tunnel.js              # Aktualizacja URL tunelu
│   ├── run-migration.js             # Uruchamianie migracji SQL
│   └── ...
│
├── public/                           # Statyczne assety
├── supabase/                         # Schemat bazy danych (migracje)
├── docs/                             # Dokumentacja techniczna
├── websocket-bridge/                 # Bridge WebSocket
├── witaline-config.json              # Konfiguracja runtime
├── railway.json                      # Konfiguracja Railway
└── .env.example                      # Szablon zmiennych środowiskowych
```

---

## Autoryzacja

WitaLine korzysta z **Next.js 16 proxy** (`src/proxy.ts`) do ochrony stron:

- **Serwer-side:** Plik `proxy.ts` jest mapowany w `next.config.ts` i chroni ścieżki `/admin/*`, `/dashboard/*`, `/onboarding` — przekierowuje niezalogowanych do `/login`
- **API Webhooki:** Uwierzytelniane przez sekretne nagłówki (ElevenLabs webhook secret, Stripe signing secret)
- **Auth:** Supabase Auth z JWT sesją w ciasteczkach (SSR przez `@supabase/ssr`)
- **Publiczne API:** Endpointy `api/elevenlabs/*`, `api/twilio/*`, `api/stripe/webhook`, `api/mcp` są wykluczone z matchera proxy

---

## Call Flow (przepływ połączenia)

```
1. Klient dzwoni na numer Twilio
       │
       ▼
2. Twilio → POST /api/twilio/spam-filter
       │  (sprawdza blacklistę, zwraca <Connect> lub <Reject>)
       │
       ▼
3. connectToAgent() w twilio-utils.ts
       │  registerCall() z dynamic_vars.business_id
       │  (rozpoczęcie konwersacji ElevenLabs ConvAI)
       │
       ▼
4. ElevenLabs agent prowadzi rozmowę
       │  Agent może wywołać MCP tool-e:
       │  • business_lookup   — wyszukanie firmy w bazie
       │  • save_lead         — zapisanie leada
       │  • check_availability — sprawdzenie terminu
       │  • create_reservation — umówienie wizyty
       │  • get_services      — lista usług
       │  • get_business_hours — godziny otwarcia
       │  • send_whatsapp     — wysyłka WhatsApp
       │  • transfer_to_human — transfer do konsultanta
       │  • create_checkout   — link płatności Stripe
       │
       ▼
5. Rozmowa zakończona
       │
       ▼
6. ElevenLabs POST → /api/elevenlabs/call-completed
       │  • Zapisuje call_logs w bazie
       │  • Odejmuje minuty z prepaid_minutes
       │  • Scorowanie rozmowy (OpenRouter GPT-4o-mini)
       │  • Wysyła WhatsApp continuity (jeśli zgoda)
       │  • Tworzy notyfikację
       │  • Generuje podsumowanie SMS
```

---

## WhatsApp Continuity

- Wysyłka przez Twilio WhatsApp API (sandbox `+14155238886`)
- Szablony: `booking`, `order`, `offer`, `payment_reminder`, `default`
- Webhook przychodzący: `/api/twilio/whatsapp` → zapis do `wa_logs` + auto-reply
- Agent może wysłać WhatsApp w trakcie rozmowy przez tool `send_whatsapp`
- Automatyczna wysyłka po rozmowie (jeśli `wa_consent` i `wa_phone`)
- Tabela `wa_logs` + kolumny `wa_limit`, `wa_used`, `wa_extra_purchased`, `whatsapp_number` w `businesses`

---

## MCP Tools (9 narzędzi agenta)

Serwer MCP (`src/lib/mcp/server.ts`) udostępnia narzędzia dla agenta ElevenLabs przez JSON-RPC endpoint (`/api/mcp`):

| Narzędzie | Opis |
|-----------|------|
| `business_lookup` | Wyszukanie firmy po nazwie lub ID |
| `save_lead` | Zapisanie leada z rozmowy |
| `check_availability` | Sprawdzenie dostępności terminu |
| `create_reservation` | Utworzenie rezerwacji/wizyty |
| `get_services` | Pobranie listy usług firmy |
| `get_business_hours` | Pobranie godzin otwarcia |
| `send_whatsapp` | Wysłanie wiadomości WhatsApp |
| `transfer_to_human` | Transfer rozmowy do konsultanta |
| `create_checkout` | Generowanie linku płatności Stripe |

Transport: Streamable HTTP (direct handler, bez SDK), `auto_approve_all: true`.

---

## Cennik (2026)

### Plany abonamentowe

| Plan | Cena/mies. | Minuty |
|------|-----------|--------|
| Start | 199 PLN | 250 min |
| Pro | 249 PLN | 300 min |
| Growth | 399 PLN | 600 min |
| Lux | 599 PLN | 800 min |
| Enterprise | 999 PLN | 1500 min |

### Elastic (pakietowy)

Próg minutowy | Cena za minutę
--- | ---
0–500 | 1,20 PLN
501–1000 | 1,10 PLN
1001–2000 | 1,00 PLN
2001–3000 | 0,95 PLN
3000+ | 0,90 PLN

Klient kupuje pakiety minut przez Stripe (one-time, `mode:payment`), minuty potrącane z `prepaid_minutes` w `call-completed`.

---

## Deploy (Railway)

Projekt skonfigurowany pod Railway (`railway.json`):

1. Podłącz repozytorium GitHub do Railway
2. Ustaw zmienne środowiskowe w Railway Dashboard
3. Railway automatycznie wykrywa `npm run build` i `npm run start`
4. **Port:** 3000 (hardcoded, Railway proxy ustawiony na 3000)
5. **Healthcheck:** `GET /api/health` — sprawdza bazę danych i zmienne env
6. **Start command:** `npm start`

Ważne: ustaw `PORT=3000` w zmiennych środowiskowych Railway.

---

## Cloudflare Tunnel (dev)

W środowisku deweloperskim Cloudflare tunnel wystawia lokalny serwer na publiczny URL:

- **Auto:** `node scripts/start.js` — uruchamia wszystko automatycznie
- **Ręcznie:** `npx cloudflared tunnel --url http://localhost:3000`

Po zmianie URL tunelu:

```bash
node scripts/setup-tunnel.js https://nowy-url.trycloudflare.com
```

Skrypt aktualizuje:
- `witaline-config.json` oraz `.env`
- Webhooki ElevenLabs (call-completed, client-data)
- Twilio voice URL (spam-filter)
- MCP server URL

---

## Subkonta Twilio (multi-tenant)

WitaLine obsługuje subkonta Twilio dla klientów wielodzierżawców:

- Kolumna `twilio_subaccount_sid` i `twilio_subaccount_auth_token` w tabeli `businesses`
- Helper w `twilio-utils.ts`, `twilio-sms.ts`, `twilio-whatsapp.ts` automatycznie wybiera subkonto
- API: `POST /api/twilio/create-subaccount`
- Zarządzanie w panelu admina

---

## Call Quality Scoring

Po każdej rozmowie `call-completed` uruchamia scoring przez OpenRouter (GPT-4o-mini):

- **Score:** 1–10 (ocena jakości rozmowy)
- **Podsumowanie:** jedna linia po polsku
- Zapis w tabeli `call_logs` (kolumny `quality_score`, `quick_summary`)
- Wyświetlenie w `CallTable.tsx` jako badge

---

## Monitoring i logi

- **Sentry:** Błędy po stronie serwera i klienta
- **Healthcheck:** `GET /api/health` — status bazy, zmiennych env, uptime
- **Logi dev:** `dev-server.log`, `tunnel.log`, `dev_out.log`
- **Konfiguracja:** `witaline-config.json` — aktualny URL tunelu, MCP server ID, agent ID

---

## Uwagi

- Cloudflare tunnel zmienia URL przy każdym restarcie — zawsze używaj `node scripts/start.js`
- HMR WebSocket może nie działać przez Cloudflare tunnel → `Ctrl+Shift+R` lub restart dev servera
- `transfer_to_number` jest wyłączone w konfiguracji agenta (nie działa dla zewnętrznych numerów)
- Webhook call-completed akceptuje żądania nawet przy błędnym secret (debug mode)
- Wszystkie webhooki agenta (call-completed, client-data) muszą być ustawione w dashboardzie ElevenLabs

---

## Licencja

Proprietary — WitaLine &copy; 2026

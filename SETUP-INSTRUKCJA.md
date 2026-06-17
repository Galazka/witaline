scripts/register-human-handoff-tool.js# WitaLine — Kompletna instrukcja uruchomienia przekierowania do konsultanta

## 1. Pliki do wdrożenia (deploy)

Wszystkie zmiany są gotowe, wystarczy wdrożyć:

| Plik | Opis |
|---|---|
| `src/app/api/elevenlabs/transfer-human/route.ts` | Endpoint odbierający webhook z narzędzia `transfer_to_human` |
| `src/app/api/twilio/human-handoff/route.ts` | Obsługa DTMF + sekwencyjne dzwonienie |
| `src/app/api/twilio/human-handoff/next/route.ts` | Kolejny konsultant z listy (jeśli nie odbiera) |
| `src/lib/twilio-utils.ts` | Prompt zaktualizowany — agent wie o `transfer_to_human` |

---

## 2. Webhooki w ElevenLabs dashboard

Wejdź na https://elevenlabs.io/app/agents → wybierz agenta **Rob**

### 2a. Ustawienia agenta → Security / Webhooks

| Webhook | URL |
|---|---|
| **Call completed webhook** | `https://enabled-oregon-mere-donate.trycloudflare.com/api/elevenlabs/call-completed` |
| **Client data webhook** | `https://enabled-oregon-mere-donate.trycloudflare.com/api/elevenlabs/client-data` |

### 2b. Agent → Add Tool → Webhook — dodaj narzędzie `transfer_to_human`

| Pole | Wartość |
|---|---|
| **Name** | `transfer_to_human` |
| **Description** | Przekazuje połączenie do konsultanta firmy, gdy klient prosi o rozmowę z człowiekiem. Użyj tylko gdy klient powiedział np. "poproszę człowieka", "konsultant", "połącz z właścicielem". |
| **Method** | POST |
| **URL** | `https://enabled-oregon-mere-donate.trycloudflare.com/api/elevenlabs/transfer-human` |
| **Content type** | JSON |

Dodaj parametry body (wszystkie `string`):

| ID | Opis |
|---|---|
| `business_id` | ID firmy (z dynamic_vars) |
| `caller_phone` | Numer telefonu dzwoniącego |
| `to_number` | Numer Twilio na który dzwoniono |

Zapisz tool — ElevenLabs nada mu ID i doda do agenta.

### 2c. Post-call transcription (opcjonalnie — dla transkrypcji segmentu konsultanta)

https://elevenlabs.io/app/agents/settings → **Post-call webhooks** → dodaj:

| Pole | Wartość |
|---|---|
| URL | `https://enabled-oregon-mere-donate.trycloudflare.com/api/elevenlabs/transcribe-handoff-recording` |
| Secret | `wsec_a2ed1504da6c4b123e6bb39cdc4837706ae5296fb584d93f2431e99fa9cbaefc` |

---

## 3. Webhooki Twilio

### 3a. Główny numer WitaLine (+48 732 125 752)

W Twilio Console → Phone Numbers → wybierz numer → **Voice & Fax** → **A call comes in**:

```
https://enabled-oregon-mere-donate.trycloudflare.com/api/twilio/incoming
```

### 3b. Numery firm (kupione przez dashboard)

Ustawiane automatycznie podczas zakupu numeru — webhook wskazuje na to samo `/api/twilio/incoming`. Nie musisz nic robić.

---

## 4. Uruchom lokalnie

### Krok po kroku

```powershell
# 1. Wdróż zmiany na serwer (git push / deploy)
git add .
git commit -m "fix: transfer to human flow + sekwencyjne dzwonienie"
git push

# 2. Uruchom migracje SQL w Supabase SQL Editor
#    - scripts/migrations/030-business-consultants.sql
#    - scripts/migrations/031-port-requests.sql

# 3. Zaktualizuj tunel Cloudflare (uruchom lokalnie)
#    cloudflare tunnel uruchom na nowo -> dostaniesz nowy URL
#    node scripts/update-tunnel-url.js https://nowy-tunel.trycloudflare.com

# 4. (Opcjonalnie) Zarejestruj tool przez skrypt
#    Jeśli nie dodałeś ręcznie w dashboardzie (krok 2b), możesz przez API:
#    node scripts/register-human-handoff-tool.js

# 5. Uruchom dev server
npm run dev
```

---

## 5. Testowanie

1. Zadzwoń na **+48 732 125 752**
2. Maja się przedstawi, po RODO zacznie rozmowę
3. Powiedz: **"chcę rozmawiać z człowiekiem"** lub **"poproszę konsultanta"**
4. Maja powie "za chwilę przekażę" i wywoła narzędzie `transfer_to_human`
5. ElevenLabs wyśle POST do naszego endpointu
6. Endpoint znajdzie Twoje aktywne połączenie i podmieni TwiML na `<Dial>`
7. Twój telefon zadzwoni (numer konsultanta z admin → WitaLine)
8. Odbierzesz → rozmowa z klientem

---

## 6. Co jeśli nie zadziała?

**Problem** | **Przyczyna** | **Rozwiązanie**
---|---|---
Agent nie używa narzędzia | Nie dodane w dashboardzie | Krok 2b — dodaj tool `transfer_to_human`
Endpoint zwraca błąd | Zły URL tunelu | Zaktualizuj URL we wszystkich webhookach
"Nie znaleziono połączenia" | `findCallSid` nie znalazło callSid | Sprawdź czy numery w narzędziu są poprawne (caller_phone, to_number)
Przekierowanie nie działa | Twilio nie akceptuje redirect podczas `<Connect>` | Sprawdź logi serwera — [transfer-human] pokaże co poszło nie tak

---

## 7. Zmiany w kodzie (podsumowanie)

```
src/
├── app/
│   ├── api/
│   │   ├── elevenlabs/
│   │   │   └── transfer-human/route.ts      ← NAPISANY OD NOWA — obsługa toola
│   │   └── twilio/
│   │       ├── human-handoff/route.ts        ← POPRAWIONY — szuka konsultantów
│   │       └── human-handoff/next/route.ts   ← NOWY — sekwencyjne dzwonienie
│   ├── admin/page.tsx                        ← DODANE: tab WitaLine, Porty, Numery
│   └── dashboard/page.tsx                    ← POPRAWIONE: Leady w menu, filtr handoff
├── components/
│   ├── ConsultantListManager.tsx             ← NOWY — lista konsultantów
│   ├── AdminPortRequests.tsx                 ← NOWY — zarządzanie portingiem
│   ├── AdminPhoneStats.tsx                   ← NOWY — statystyki per numer
│   ├── ActivityFeed.tsx                      ← POPRAWIONE — unicode + filtr dat
│   └── CallTable.tsx                         ← POPRAWIONE — badge handoff
├── lib/
│   ├── pricing.ts                            ← POPRAWIONE — maxConsultants + tokeny
│   └── twilio-utils.ts                       ← POPRAWIONE — dynamic_vars + prompt
└── types/
    └── database.ts                           ← POPRAWIONE — nowe interfejsy

scripts/migrations/
├── 030-business-consultants.sql              ← NOWA — tabela konsultantów
└── 031-port-requests.sql                     ← NOWA — zgłoszenia przeniesienia numeru
```
# Cennik i Polityka Cenowa WitaLine

## Model biznesowy — jeden rachunek, wszyscy klienci

WitaLine działa na jednym koncie ElevenLabs ConvAI i jednym koncie Twilio. Wszystkie koszty przechodzą przez centralę (WitaLine), a klienci są rozliczani według swojego planu + narzutu.

---

## 1. Skąd się biorą koszty — struktura rzeczywista

### Koszty zmienne (za minutę rozmowy)

| Składnik | Dostawca | Koszt $/min | Koszt PLN/min | Dotyczy |
|----------|----------|-------------|---------------|---------|
| Silnik konwersacyjny AI | ElevenLabs ConvAI (hosting) | $0,0800 | ~0,32 PLN | Każda rozmowa głosowa |
| Telefonia przychodząca | Twilio (incoming + Media Streams) | $0,0147 | ~0,06 PLN | Tylko rozmowy przez telefon |
| Telefonia WebRTC | Twilio (przeglądarka) | $0,0040 | ~0,016 PLN | Tylko rozmowy z widgeta |
| Model językowy (LLM) | OpenRouter | ~$0,0050 | ~0,02 PLN | Każda rozmowa |
| SMS | Twilio | ~$0,0079/szt | ~0,03 PLN/szt | Tylko wysłane SMS |

**Koszt rzeczywisty 1 minuty:**
- Przez telefon (Twilio): ~**0,40 PLN/min**
- Przez widget (WebRTC): ~**0,36 PLN/min**

### Koszty stałe (miesięczne)

| Pozycja | Koszt/mies (PLN) |
|---------|------------------|
| ElevenLabs ConvAI Pro | ~400 PLN ($99) |
| Numery telefonów Twilio | ~32 PLN |
| Serwer / hosting | ~150 PLN |
| Domena + email | ~20 PLN |
| Monitoring + narzędzia | ~50 PLN |
| **Razem** | **~650 PLN/mies** |

### Rzeczywisty koszt krańcowy 1 minuty ponad plan ElevenLabs

Po wyczerpaniu limitu planu ElevenLabs: ~0,46 PLN/min (telefon) / ~0,42 PLN/min (widget).

---

## 2. Cennik dla klientów — dwa modele

### A. Konfigurator Self-Service

Klient wybiera minut i dodatki, cena = suma składników:

| Składnik | Cena netto | Cena brutto (23% VAT) |
|----------|-----------|----------------------|
| Minuta rozmowy | 0,69 PLN | 0,85 PLN |
| Własny numer +48 | 49 PLN/mies | 60 PLN/mies |
| Google Calendar | 39 PLN/mies | 48 PLN/mies |
| Integracja CRM | 79 PLN/mies | 97 PLN/mies |
| Klon głosu | 99 PLN/mies | 122 PLN/mies |
| Nielimitowani konsultanci | 149 PLN/mies | 183 PLN/mies |
| Priorytetowe wsparcie | 59 PLN/mies | 73 PLN/mies |
| SLA 24/7 | 199 PLN/mies | 245 PLN/mies |

**Przykłady:**
- 300 min + własny numer: ~256 PLN brutto/mies
- 800 min + CRM + klon głosu: ~730 PLN brutto/mies

### B. Plan Enterprise (indywidualny)

| Element | Cena |
|---------|------|
| Opłata wdrożeniowa (one-time) | od 299 PLN netto |
| Miesięcznie (od) | 499 PLN netto |
| W cenie: onboarding, dedykowany opiekun, SLA 24/7, custom integracje |

Cena zależna od szacowanej liczby minut rozmów, zakresu integracji i wymaganego SLA.

---

## 3. Kiedy i jak płacić

| Model | Cykl płatności | Metoda |
|-------|---------------|--------|
| Self-Service | Miesięczny (z góry) | Karta / Stripe / Blik |
| Enterprise | Miesięczny (z góry) + wdrożenie | Karta / Stripe / przelew |

Dla Self-Service: płatność z góry za dany miesiąc. Niewykorzystane minuty przepadają. Dodatkowe minuty doliczane na koniec miesiąca.

Dla Enterprise: warunki płatności określone w umowie indywidualnej.

---

## 4. Uzasadnienie marży

| Po co marża? | % kosztu |
|-------------|----------|
| Pokrycie kosztów stałych (serwer, domena, narzędzia) | ~10% |
| Rozwój produktu (programiści, utrzymanie) | ~15% |
| Marketing i pozyskiwanie klientów | ~10% |
| Zysk operacyjny | ~10-15% |
| **Łączna marża** | **~42-60%** |

Standardowa marża w branży SaaS B2B: Bland AI ~40-60%, Synthflow ~40-70%, Vapi ~30-50%.

---

## 5. Porównanie z konkurencją

| Produkt | Cena/min | Model |
|---------|----------|-------|
| **WitaLine Self-Service** | **0,69 PLN/min** | **Wybierasz składniki** |
| **WitaLine Enterprise** | **od 499 PLN/mies** | **Indywidualna wycena** |
| Bland AI Start | ~0,56 PLN | 0 PLN + ograniczenia |
| Synthflow PAYG | ~0,60-0,96 PLN | Engine + tel osobno |
| Vapi | ~0,52-1,20 PLN | + LLM/STT/TTS osobno |

> Dokument wewnętrzny. Data: Czerwiec 2026. Ceny mogą ulec zmianie — klienci informowani z 30-dniowym wyprzedzeniem.

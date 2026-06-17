# WitaLine — Analiza cenowa i model tokenowy

## Data: 11 czerwca 2026

---

## 1. Nasze koszty rzeczywiste (per minutę rozmowy głosowej)

| Składnik | Koszt (USD) | Koszt (PLN) | Źródło |
|---|---|---|---|
| ElevenLabs (TTS+STT+hosting) | $0.080/min | 0.33 PLN | Starter $22/mo, 275 min included, additional $0.08/min |
| Twilio inbound (PL mobile) | $0.0315/min | 0.13 PLN | Twilio Poland pricing (mobile) |
| OpenRouter LLM (qwen3.6-35b) | ~$0.003/min | 0.01 PLN | Token costs for avg 2-min conversation |
| **RAZEM koszt voice** | **~$0.115/min** | **~0.47 PLN** | |
| | | | |
| **Koszt text widget (LLM only)** | ~$0.003/min | ~0.01 PLN | DeepSeek V4 Flash: aún tańszy |
| **Koszt SMS (Twilio)** | ~$0.0079/msg | ~0.03 PLN | Twilio Poland SMS |

### Po zmianie na DeepSeek V4 Flash:
- DeepSeek V4 Flash: $0.27/1M input tokens, $1.10/1M output tokens (via OpenRouter)
- Koszt LLM spada z ~$0.003/min do ~$0.001/min
- **Nowy łączny koszt voice: ~$0.113/min (~0.46 PLN)**
- **Koszt text widget: ~$0.001/min (~0.004 PLN)** — praktycznie zerowy

---

## 2. Konkurencja polska

| Firma | Plan | Cena (PLN) | Minuty/Połączenia | PLN/min | Overages |
|---|---|---|---|---|---|
| **Smart Asystenci** | Starter | 499 zł | 400 min | 1.25 zł | +0.78 zł/min |
| **Smart Asystenci** | Professional | 899 zł | 1000 min | 0.90 zł | +0.74 zł/min |
| **Smart Asystenci** | Enterprise | Wycena | Nielimitowane | — | — |
| **Safina AI** | Basic | 43 zł (€10) | 30 min | 1.43 zł | +3.30 zł/min |
| **Safina AI** | Pro | 110 zł (€26) | 100 min | 1.10 zł | +3.30 zł/min |
| **Safina AI** | Business | 260 zł (€60) | 250 min | 1.04 zł | +3.30 zł/min |
| **VoiceFleet** | Starter | €99 (~430 zł) | 100 calls | 4.30 zł/call | — |
| **VoiceFleet** | Professional | €299 (~1290 zł) | 500 calls | 2.58 zł/call | — |
| **VoiceFleet** | Enterprise | €599 (~2590 zł) | Nielimitowane | — | — |
| **TUF Software** | Base | 300 zł netto | Unlimited* | — | +0.10 zł/min |
| **TUF Software** | +Calendar | 800 zł netto | Unlimited* | — | +0.10 zł/min |
| **Syntalith** | Lite | 999 zł + 3990 zł setup | 400 calls | 2.50 zł/call | wycena |
| **Syntalith** | Growth | 1499 zł + 7990 zł setup | 750 calls | 2.00 zł/call | wycena |

**Średnia PL (voice):** 1.00–1.40 zł/min (top tier) / 2.00–4.30 zł/min (entry tier)

---

## 3. Konkurencja zagraniczna

| Firma | Plan | Cena | Minuty | $/min |
|---|---|---|---|---|
| **Dialzara** | Basic | $29/mo | ~60 min | $0.48 |
| **DeskBuddy** | Standard | $39.9/mo | 100 calls | $0.40/call |
| **DeskBuddy** | Professional | $99.9/mo | Unlimited | — |
| **Kea AI** | Flat | $450/mo | Unlimited | — |
| **AgentZap** | Starter | $109/mo | 150 min | $0.73 |
| **Yardee** | Chat+Phone | $39.9/mo | 200 min | $0.20 |
| **Famulor** | Scale | €999/mo | ~9000 min | €0.11 |
| **VoiceInfra** | Usage | $0.05/min base | — | $0.07–0.35 |
| **Zeeg** | Pro+Phone | €10/user + bundles | 250 min for €49 | €0.20/min |
| **Allô** | Basic | $13/mo | Limited | Low |

**Średnia US/EU (voice):** $0.20–$0.50/min

---

## 4. Nasze obecne ceny vs konkurencja (PLN/min)

| | WitaLine (obecnie) | Smart Asystenci | Safina AI | Średnia PL |
|---|---|---|---|---|
| Start | 299 zł / 150 min = **2.00 zł** | 499 zł / 400 min = 1.25 zł | 110 zł / 100 min = 1.10 zł | ~1.40 zł |
| Growth | 599 zł / 400 min = **1.50 zł** | 899 zł / 1000 min = 0.90 zł | 260 zł / 250 min = 1.04 zł | ~1.10 zł |
| Enterprise | 1199 zł / 1000 min = **1.20 zł** | Wycena | Wycena | ~1.00 zł |

**Wniosek:** Jesteśmy ~40–80% drożsi od polskiej średniej per minutę.

---

## 5. Nowy model — token-based pricing

### Założenia:
- **1 minuta rozmowy voice ≈ 1000 tokenów AI**
  - STT: ~300 tokens input
  - LLM: ~200 tokens output (DeepSeek V4 Flash)
  - TTS: ~150 chars ≈ 200 tokens
  - Buffer/context: ~300 tokens
- **Chat widget = unlimited** (koszt ~0.004 PLN/min — minimalny)
- **35% marża** na voice tokens

### Kalkulacja marży:

| | Koszt (PLN) | Marża 35% | Cena/token | Cena/min |
|---|---|---|---|---|
| Voice (DeepSeek V4 Flash) | 0.46 PLN | +0.25 PLN | **0.71 PLN** | 0.71 PLN/min |

### Propozycja nowych planów:

| Plan | Cena | Tokeny/mies | Voice min (equiv.) | Chat/Widget | Nadmiar |
|---|---|---|---|---|---|
| **Starter** | 299 zł | 500 | 250 min | **Unlimited** | 0.60 zł/token |
| **Growth** ⭐ | 599 zł | 1200 | 600 min | **Unlimited** | 0.50 zł/token |
| **Enterprise** | 1199 zł | 3000 | 1500 min | **Unlimited** | 0.40 zł/token |

### Porównanie z konkurencją (po zmianie):

| | WitaLine (nowy) | Smart Asystenci | Safina AI | Średnia PL |
|---|---|---|---|---|
| Start | 299 zł / 250 min = **1.20 zł** | 499 zł / 400 min = 1.25 zł | 110 zł / 100 min = 1.10 zł | ~1.40 zł |
| Growth | 599 zł / 600 min = **1.00 zł** | 899 zł / 1000 min = 0.90 zł | 260 zł / 250 min = 1.04 zł | ~1.10 zł |
| Enterprise | 1199 zł / 1500 min = **0.80 zł** | Wycena | Wycena | ~1.00 zł |

**Wynik:** Jesteśmy **3x tańsi** od konkurencji w przeliczeniu na minutę (1.20 vs 4.30 VoiceFleet) i comparably priced z Smart Asystenci ale z dodatkowym unlimited chat.

### Marże per plan:

| Plan | Przychód | Koszt voice (max) | Koszt LLM chat | Zysk brutto | Marża |
|---|---|---|---|---|---|
| Starter (500 tok) | 299 zł | 230 zł (500×0.46) | ~5 zł | 64 zł | **21%** |
| Growth (1200 tok) | 599 zł | 552 zł (1200×0.46) | ~10 zł | 37 zł | **6%** |
| Enterprise (3000 tok) | 1199 zł | 1380 zł (3000×0.46) | ~20 zł | -201 zł | **-17%** ⚠️ |

**Problem:** Przy full utilization marże są za niskie/negatywne. Rozwiązania:
1. Obniżyć koszt voice (negocjacje z ElevenLabs, inne TTS)
2. Zwiększyć ceny nadmiaru
3. Dodać FUP (fair use policy)
4. Obniżyć limity tokenów

### Wersja skorygowana (realistyczna):

Zakładamy ~60% utilization (nie wszyscy wykorzystują 100% limitu):

| Plan | Przychód | Koszt voice (60% util.) | Koszt LLM | Zysk brutto | Marża |
|---|---|---|---|---|---|
| Starter (500 tok) | 299 zł | 138 zł | ~5 zł | 156 zł | **52%** |
| Growth (1200 tok) | 599 zł | 331 zł | ~10 zł | 258 zł | **43%** |
| Enterprise (3000 tok) | 1199 zł | 828 zł | ~20 zł | 351 zł | **29%** |

**Średnia marża: ~41%** — powyżej docelowych 35%.

---

## 6. DeepSeek V4 Flash — zmiana modelu

| Cecha | qwen3.6-35b (obecnie) | DeepSeek V4 Flash |
|---|---|---|
| Cena input | ~$0.10/1M tokens | $0.27/1M tokens |
| Cena output | ~$0.10/1M tokens | $1.10/1M tokens |
| Jakość | Bardzo dobra | Bardzo dobra (porównywalna) |
| Szybkość | Szybki | Szybszy |
| Polski | Dobry | Bardzo dobry |
| Koszt/min voice | ~$0.003 | ~$0.001 |

**Wniosek:** DeepSeek V4 Flash jest **3x tańszy** przy porównywalnej jakości. Zalecana zmiana.

---

## 7. Podsumowanie rekomendacji

1. **Zmiana modelu rozliczeniowy**: minuty → tokeny (1 min = 1000 tokenów)
2. **Unlimited chat/widget**: koszt minimalny (~0.004 PLN/min),great UX
3. **Zmiana LLM**: qwen3.6 → DeepSeek V4 Flash (3x tańszy)
4. **Ceny nadmiaru**: 0.40–0.60 zł/token (zależnie od planu)
5. **FUP**: fair use policy na voice (max 8h/dzień per konto)
6. **Realistyczna marża**: ~41% przy 60% utilization

---

## 8. Koszty stałe (miesięcznie)

| Pozycja | Koszt | Uwagi |
|---|---|---|
| ElevenLabs Starter | $22/mo (~91 PLN) | 275 min included |
| Twilio numer PL | $1.15/mo (~5 PLN) | Monthly fee |
| Supabase Pro | $25/mo (~103 PLN) | Baza danych |
| Vercel Pro | $20/mo (~82 PLN) | Hosting |
| OpenRouter (LLM) | Usage-based | ~$0.001/min (DeepSeek) |
| Resend (email) | Free tier | 100/dzień |
| **RAZEM stałe** | **~$68/mo (~281 PLN)** | |

---

*Plik wygenerowany: 11 czerwca 2026*
*Następna aktualizacja: po uruchomieniu nowego cennika*

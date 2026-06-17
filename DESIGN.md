# WitaLine — Design System

> **Platforma B2B SaaS** — automatyczna recepcja AI dla polskich firm.
> Główny cel użytkownika: zarządzanie połączeniami, rezerwacjami, opiniami, kalendarzem i subskrypcją w jednym panelu.
> Platforma: Strona internetowa / SaaS (Next.js 16, App Router).
> Grupa docelowa: właściciele MŚP (restauracje, salony beauty, gabinety medyczne, kancelarie, kluby fitness).

---

## 1. Brand Identity

### Logo

- **Symbol**: Minimalistyczny okrąg — lewa strona (wzór słuchawki telefonicznej w linii) + prawa strona (półkole fali głosowej z dwóch kół modernistycznych okrążających koncentrycznie), kontur czarny #000000, wypełnienie zielenią #72B176.
- **Logotyp**: "WitaLine" w bardzo pogrubionej geometriicznej bezszeryfowej czcionce (Inter Tight waga 900), krok liter ~0.04em, czarny #000000.
- **Marka pod logo** (tagline): "Tak, słucham" — waga Regular/Medium, mniejszy rozmiar, zieleń #72B176.
- **Wariant jasny** (na tła ciemne): biały zielony symbol + biały napis + zielony tagline.
- **Wariant ciemny** (na tła jasne): zielony symbol + czarny napis + zielony tagline.
- **Favicon**: Sam symbol (słuchawka + fala) w zielonym #72B176 na przezroczystym tle, 32×32px.

### Brand Voice

- Język: **polski**, bezpośredni, pomocny, profesjonalny.
- Ton: pewny, ale nie nachalny; wspierający, ale nie protekcjonalny.
- Zwroty: "Twoja firma nie przegapia już żadnych połączeń", "automatyczna recepcja 24/7", "Tak, słucham".
- Unikane: żargon techniczny, anglicyzmy w treściach głównych, infantylne zwroty.

### Słowa kluczowe wizualne

`dynamiczny` &middot; `zaufany` &middot; `nowoczesny` &middot; `techniczny` &middot; `minimalistyczny`

---

## 2. Typography

System fontów oparty na **Geist** (sans) i **Geist Mono** — wbudowane w framework poprzez `next/font/google`. Dla logo używa się **Inter Tight w wadze 900** (załadowana z `next/font/google`) oraz **Inter Regular/Medium** dla tagline'u.

| Styl | Font | Waga | Rozmiar | Line-height | Tracking | Użycie |
|---|---|---|---|---|---|---|
| **H1** | Inter Tight | 900 (Black) | 2.5rem (40px) | 1.1 | 0.02em | Nagłówek strony landingowej |
| **H2** | Inter Tight | 800 (ExtraBold) | 2rem (32px) | 1.15 | 0.01em | Nagłówki sekcji |
| **H3** | Inter | 600 (Semibold) | 1.25rem (20px) | 1.4 | normal | Nagłówki kart / sekcji dashboardu |
| **Body** | Inter | 400 (Regular) | 1rem (16px) | 1.6 | normal | Tekst podstawowy, paragrafy |
| **Body Small** | Inter | 400 (Regular) | 0.875rem (14px) | 1.5 | normal | Tekst pomocniczy, etykiety, inputy |
| **Caption** | Inter | 500 (Medium) | 0.75rem (12px) | 1.4 | 0.02em | Timestampy, tagi, metryki pomocnicze |
| **Mono** | Geist Mono | 400 (Regular) | 0.875rem (14px) | 1.6 | normal | JSON, system prompt preview, cennik (numery) |

### Hierarchia w dashboardzie

```
┌──────────────────────────────────────────────────┐
│  H1: "Panel zarządzania"                         │
│                                                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐     │
│  │ H2: Stat. │  │ H2: Ostat│  │ H2: Paki. │     │
│  │ Body Lg   │  │ Body Lg   │  │ Body Lg   │     │
│  └───────────┘  └───────────┘  └───────────┘     │
│  ┌──────────────────────────────────────────┐    │
│  │ H3: "Połączenia"                         │    │
│  │ Body Medium — wiersze tabeli             │    │
│  │ Caption — "2 godz. temu"                 │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

---

## 3. Color Palette

### Brand — Zielony (Primary)

Token Tailwind v4: `--color-brand-*`

| Rola | Token | HEX | Przykład użycia |
|---|---|---|---|
| **Primary** | `brand-600` | `#72B176` | Przyciski CTA, linki, aktywny tab, logo symbol |
| **Primary hover** | `brand-700` | `#5A9A5F` | Hover na przyciskach CTA |
| **Primary light** | `brand-50` | `#F0F7F1` | Tło sekcji z akcentem, aktywny stan kafelka, success bg |
| **Primary border** | `brand-200` | `#B8D9BA` | Outline focus, krawędzie aktywnego elementu |
| **Primary text** | `brand-800` | `#3D6B42` | Tekst na jasnym tle z zielonym akcentem |

### Neutral — Czarny/Biały (Secondary + Neutrals)

| Rola | Token | HEX | Przykład użycia |
|---|---|---|---|
| **Text primary** | `zinc-900` | `#18181b` | Nagłówki, body text, logo napis |
| **Text secondary** | `zinc-500` | `#71717a` | Etykiety, placeholder, caption |
| **Background** | `zinc-50` | `#fafafa` | Tło strony / dashboardu |
| **Surface** | `white` | `#ffffff` | Karty, moduły, tabele |
| **Surface border** | `zinc-200` | `#e4e4e7` | Krawędzie kart, separatorów |
| **Text disabled** | `zinc-300` | `#d4d4d8` | Wyłączone przyciski, nieaktywne elementy |
| **Hover** | `zinc-100` | `#f4f4f5` | Hover na wierszach tabeli |

### Status

| Rola | HEX | Token | Użycie |
|---|---|---|---|
| **Success** | `#72B176` | `brand-500` | Aktywny, opłacony, completed |
| **Error** | `#dc2626` | `red-600` | Błąd, suspended, payment_failed |
| **Warning** | `#d97706` | `amber-600` | Ostrzeżenie, pending, trial kończący się |
| **Info** | `#2563eb` | `blue-600` | Informacja, nowa funkcja, pomoc |

### Wariant Light / Dark (docelowo)

Na MVP wystarcza wariant **Light** (background: `#fafafa`, surface: `#ffffff`). Dark mode jako przyszłe zadanie.

---

## 4. Spacing & Layout Grid

### System spacing

Oparty na Tailwind v4 scale: `{4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64}` (w px: 1rem = 16px).

- **Container max-width**: `max-w-7xl` (1280px) dla dashboardu, `max-w-2xl` dla formularzy (onboarding).
- **Padding strony**: `px-4 py-8` / `md:px-8 md:py-12`.
- **Karty (Cards)**: `p-6` wewnątrz, odstęp między kartami `gap-6`.
- **Gap między sekcjami**: `space-y-8` / `mb-10`.

### Responsywność

| Breakpoint | Min-width | Layout |
|---|---|---|
| Mobile | 0–639px | 1 kolumna, bottom nav (jeśli PWA) |
| Tablet | 640–1023px | 2 kolumny grid |
| Desktop | 1024px+ | 3+ kolumny / sidebar + content |

---

## 5. Component Library

### 5.1 Buttons

| Wariant | CSS | Użycie |
|---|---|---|
| **Primary Filled** | `bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-teal-800 transition disabled:opacity-50` | Główne CTA: "Zapisz", "Dodaj", "Aktywuj" |
| **Secondary Outlined** | `border border-zinc-300 text-zinc-700 px-5 py-2.5 rounded-lg font-medium hover:bg-zinc-50 transition` | "Anuluj", "Wstecz", akcje drugorzędne |
| **Ghost** | `text-zinc-500 px-3 py-2 rounded-lg hover:bg-zinc-100 transition` | "Edytuj", "Usuń" w tabelach, ikonowe akcje |
| **Danger** | `bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition` | "Usuń konto", "Zawieś", destrukcyjne akcje |
| **Small** | `px-3 py-1.5 text-xs rounded-md` | Akcje inline w tabeli |

Wszystkie przyciski mają `cursor-pointer`, `transition` i `disabled:opacity-50 disabled:cursor-not-allowed`.

### 5.2 Cards

```css
.bg-white rounded-xl border border-zinc-200 p-6
```

- **Shadow**: Brak domyślnego cienia (płaski, nowoczesny wygląd). Dopuszczalny `shadow-sm` na hover dla kart klikalnych.
- **Border radius**: `rounded-xl` (12px) dla kart, `rounded-lg` (8px) dla inputów/pól.
- **Wariant podświetlony** (active/selected): `ring-2 ring-teal-500` lub `border-teal-700 bg-teal-50`.
- **Wariant statystyczny** (KPI tile): ikona + liczba + etykieta, wyśrodkowane, `p-6 bg-white rounded-xl border border-zinc-200`.

### 5.3 Form Fields (Inputs)

Material Design 3 — styl "Outlined":

```css
/* Standard */
w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm
focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600
placeholder:text-zinc-400 transition

/* Error */
border-red-400 focus:ring-red-500/30 focus:border-red-500

/* Disabled */
bg-zinc-50 text-zinc-400 cursor-not-allowed

/* Label */
block text-sm font-medium text-zinc-700 mb-1.5

/* Error message */
text-xs text-red-600 mt-1
```

**Select** (dropdown): Taki sam styl jak input. Używać natywnego `<select>` lub prostego wrappera.

**Checkbox** / **Toggle**:
- Checkbox: `w-4 h-4 rounded border-zinc-300 text-teal-700 focus:ring-teal-500`.
- Toggle (switch): `relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-300 data-[checked]:bg-teal-700 transition`.

### 5.4 Tables

```css
/* Container */
bg-white rounded-xl border border-zinc-200 overflow-hidden

/* Header */
bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wider

/* Row */
border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition

/* Cell */
px-4 py-3 text-sm text-zinc-700

/* Expandable row */
bg-zinc-50/50 px-4 py-4 border-t border-zinc-100
```

### 5.5 Tabs (Dashboard navigation)

```css
/* Container */
flex gap-1 bg-zinc-100 p-1 rounded-lg

/* Active tab */
bg-white text-zinc-900 shadow-sm rounded-md px-4 py-2 text-sm font-medium

/* Inactive tab */
text-zinc-500 hover:text-zinc-700 px-4 py-2 text-sm font-medium rounded-md transition
```

### 5.6 Badges / Status Tags

```css
/* Ogólny */
inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium

/* Success (active/completed) */
bg-green-100 text-green-800

/* Warning (pending/trial) */
bg-amber-100 text-amber-800

/* Error (suspended/failed) */
bg-red-100 text-red-800

/* Neutral (inactive/draft) */
bg-zinc-100 text-zinc-600

/* Info */
bg-blue-100 text-blue-800
```

### 5.7 Modal / Overlay

```css
/* Overlay */
fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4

/* Modal card */
bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl

/* Header */
flex items-center justify-between mb-4

/* Close button */
text-zinc-400 hover:text-zinc-600 transition
```

### 5.8 Navigation

**Dashboard (Web)**: **Tab Bar** poziomy (zakładki) — opisany w 5.5.

**Landing page**: **Top navigation** — `flex justify-between items-center px-6 py-4`, logo po lewej, `Auth UI` + CTA "Rozpocznij" po prawej.

**Admin panel**: **Sidebar** — `w-64 min-h-screen bg-white border-r border-zinc-200 p-4`, logo u góry, linki nawigacji pionowej.

---

## 6. Iconography

- **Zestaw**: **Material Symbols Outlined** (Google Fonts) — ładowane przez CDN lub jako komponenty SVG.
- **Rozmiary**: `w-5 h-5` (20px) w przyciskach, `w-4 h-4` (16px) inline, `w-6 h-6` (24px) w nawigacji.
- **Kolor**: `text-zinc-500` domyślnie, `text-teal-700` dla akcentu, `text-white` na ciemnym tle.
- **Waga stroke**: 300 (Outlined) — delikatne, nowoczesne.

### Kluczowe ikony dla dashboardu

| Ikona | Użycie |
|---|---|
| `call` | Zakładka "Połączenia" |
| `calendar_month` | Zakładka "Kalendarz" / "Rezerwacje" |
| `star` | Zakładka "Opinie" |
| `bar_chart` | Zakładka "Statystyki" |
| `settings` | "Integracje" / "Ustawienia" |
| `widgets` | "Widget" / "Osadź" |
| `dictionary` | "Baza wiedzy" |
| `credit_card` | "Pakiet i płatności" |
| `play_circle` | Odtwarzacz nagrań |
| `check_circle` | Sukces / completed |
| `warning` | Ostrzeżenie / pending |
| `error` | Błąd / suspended |
| `content_copy` | Kopiuj (embed code) |
| `open_in_new` | Link zewnętrzny |
| `more_vert` | Menu kontekstowe w tabeli |
| `add` | Dodaj nowy element |
| `edit` | Edytuj |
| `delete` | Usuń |
| `search` | Szukaj |

---

## 7. Illustrations

- **Styl**: **Minimalist vector** — płaskie, 2-kolorowe ilustracje (teal + zinc), bez cieni, z zaokrąglonymi kształtami.
- **Zastosowanie**: Empty states w dashboardzie (brak połączeń, brak rezerwacji, brak opinii).

### Empty State — 3 grafiki koncepcyjne

1. **Brak połączeń** — Pusta słuchawka telefonu z falą dźwiękową, obok napis "Jeszcze żadne połączenie nie zostało odebrane. Twój asystent AI czeka na pierwszy telefon."
2. **Brak rezerwacji** — Pusty kalendarz z zaznaczoną dzisiejszą datą, napis "Brak rezerwacji na najbliższy czas. Rezerwacje pojawią się tutaj automatycznie po rozmowach."
3. **Brak opinii** — Pusta gwiazdka (outline) z dymkiem, napis "Opinie klientów zbierane są automatycznie po każdej rozmowie."

Każda grafika: maksymalnie 2 kolory (teal-500 + zinc-300), wyśrodkowana, ~160×120px.

---

## 8. Screen Designs

### 8.1 Landing Page (publiczna)

**Struktura** (od góry do dołu):

1. **Top nav** — logo, linki (Jak działa? / Cennik / Kontakt), Auth UI (Zaloguj), CTA "Rozpocznij bezpłatnie".
2. **Hero section** — H1 "Automatyczna recepcja AI dla Twojej firmy. 24/7.", Body Large opis, podwójny CTA ("Sprawdź plany" / "Zobacz demo").
3. **3-feature grid** (3 karty w rzędzie) — Automatyczne odbieranie, Rezerwacje i zamówienia, Dashboard.
4. **Pricing section** — 3 kolumny (Start / Pro / Enterprise), każda z `features[]` listą, ceną, CTA.
5. **CTA bottom** — "Gotowy na automatyzację? Zacznij w 5 minut."
6. **Footer** — logo, linki, kontakt, regulamin.

### 8.2 Dashboard (główny ekran po zalogowaniu)

**Struktura**:

1. **DashboardHeader** — pasek z progressem (minuty wykorzystane / limit), obliczone oszczędności, przycisk "Dodaj środki".
2. **Tab bar** (poziomy, opisany w 5.5):
   - Połączenia | Rezerwacje | Kalendarz | Opinie | Statystyki | Pakiet | Baza wiedzy | Widget | Integracje
3. **Content area** — zmienia się w zależności od aktywnego taba:
   - **Połączenia** → CallTable (expandable rows: transcription, recording player)
   - **Rezerwacje** → ReservationsTable + NewReservationForm (modal)
   - **Kalendarz** → CalendarView (siatka miesięczna) + CalendarEditor + ServicesEditor
   - **Opinie** → FeedbackPanel (gwiazdki, dystrybucja, kategorie, lista)
   - **Statystyki** → KPI tiles (łączne połączenia, średnia ocena, rezerwacje, oszczędności)
   - **Pakiet** → PlanUpgrade (aktualny plan, progres, przycisk zmiany)
   - **Baza wiedzy** → KnowledgeEditor (textarea prompt + JSON catalog)
   - **Widget** → WidgetSettings (embed code, preview, instrukcja)
   - **Integracje** → IntegrationsSettings (Google Calendar, SMS test)

### 8.3 Onboarding / Register (self-service, 5 kroków)

Każdy krok: max-w-2xl wyśrodkowany, progress indicator u góry.

1. **Wybierz plan** — 3 karty planów (Start / Pro / Enterprise) z cenami i cechami.
2. **Załóż konto** — Supabase Auth UI (email + hasło).
3. **Dane firmy** — Industry template grid (6 przycisków: Gastronomia, Beauty, Medycyna, Prawo, Fitness, Inna) + nazwa firmy, www, telefon, zgody.
4. **AI skanuje** — Spinner / progress bar "Skanowanie strony i generowanie asystenta..."
5. **Recenzja i aktywacja** — Podgląd wygenerowanego promptu (textarea do edycji), przycisk "Aktywuj konto".

Po aktywacji: przekierowanie do `/dashboard` z komunikatem sukcesu.

### 8.4 Admin Panel (dla administratora platformy)

**Sidebar** (lewa kolumna):
- Dashboard (statystyki platformy)
- Firmy (lista wszystkich businesses)
- Leadzi (zapytania sprzedażowe)

**Content**:
- **Dashboard**: 6 KPI tiles (aktywne firmy, leady, łączne połączenia, średnia ocena, przychód, zawieszone)
- **Firmy**: tabela z kolumnami: Nazwa, Plan, Status, Połączenia, Ostatnia aktywność, Akcje (Zawieś / Aktywuj)
- **Leadzi**: karty (AdminLeadCard) z system promptem + przycisk "Aktywuj"

### 8.5 Reseller Panel

`/reseller` — prosty dashboard dla partnerów:

- Statystyki (liczba klientów, łączne połączenia, przychód z markup)
- Tabela klientów (nazwa, plan, status, markup)
- Link partnerski do udostępnienia

---

## 9. Responsive Behavior

| Ekran | Zachowanie |
|---|---|
| Mobile < 640px | Dashboard tabs → dropdown / scroll. Karty w 1 kolumnie. Tabela → lista kart (każdy wiersz jako osobna karta). |
| Tablet 640–1023px | 2-kolumnowy grid kart. Tabela standardowa z h-scroll. |
| Desktop 1024px+ | 3-kolumnowy grid. Full-width tabela. Sidebar w admin panelu. |

---

## 10. Motion & Interaction

| Element | Zachowanie | Czas | Easing |
|---|---|---|---|
| Button hover | background color | 150ms | ease-in-out |
| Card hover | shadow-sm | 200ms | ease-out |
| Tab switch | natychmiast (brak opóźnienia) | 0 | — |
| Modal open | fade in overlay + scale up card | 200ms | ease-out |
| Row expand | slide down | 200ms | ease-in-out |
| Toast | slide in z góry, fade out po 3s | 300ms | ease-out |
| Progress bar | animate width | 500ms | ease-in-out |

Wszystkie transitiony: `transition` klasa Tailwind.

---

## 11. Tailwind v4 Theme Configuration

Poniższa konfiguracja jest już zdefiniowana w `src/app/globals.css` i stanowi źródło prawdy:

```css
@import "tailwindcss";

@theme inline {
  --color-background: #ffffff;
  --color-foreground: #171717;
  --color-teal-50: #f0fdfa;
  --color-teal-100: #ccfbf1;
  --color-teal-200: #99f6e4;
  --color-teal-300: #5eead4;
  --color-teal-400: #2dd4bf;
  --color-teal-500: #14b8a6;
  --color-teal-600: #0d9488;
  --color-teal-700: #0f766e;
  --color-teal-800: #115e59;
  --color-teal-900: #134e4a;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

**Semantyczne mapowanie dla komponentów** (do użycia w klasach):

| Semantycznie | Token Tailwind |
|---|---|
| `--primary` | `teal-700` |
| `--primary-hover` | `teal-800` |
| `--primary-light` | `teal-50` |
| `--bg-page` | `zinc-50` |
| `--bg-surface` | `white` |
| `--border-subtle` | `zinc-200` |
| `--text-default` | `zinc-900` |
| `--text-muted` | `zinc-500` |

---

## 12. Accessibility

- **Kontrast**: wszystkie pary tekst/tło spełniają WCAG AA (min. 4.5:1 dla body, 3:1 dla large text).
- **Focus**: wszystkie interaktywne elementy mają widoczny focus ring (`focus:ring-2 focus:ring-teal-500/30`).
- **Etykiety**: każdy input ma `<label>` z `htmlFor`.
- **ARIA**: przyciski ikonowe mają `aria-label`, expandery mają `aria-expanded`.
- **Ruch**: preferuje `prefers-reduced-motion: reduce` — wyłącza animacje.

---

*Ten dokument stanowi źródło prawdy dla wszystkich komponentów UI w projekcie WitaLine. Wszystkie zmiany w wyglądzie muszą być zgodne z powyższymi regułami.*

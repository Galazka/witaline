---
version: alpha
name: WitaLine-design-system
description: A B2B SaaS design system for an AI-powered telephone receptionist platform. Built on a warm off-white canvas with a signature brand-green accent, Inter/Inter Tight typography, and glass-morphism surfaces. The system pairs editorial display tiers (Inter Tight at weight 600) with clean Inter body text, and uses a green gradient as its primary depth medium. Buttons are rounded-rectangle (10px), cards sit on white with warm-gray borders, and the dashboard track uses a dark-zinc sidebar shell.

colors:
  primary: "#3CBF4A"
  primary-gradient: "linear-gradient(135deg, #3CBF4A, #2EA03A)"
  primary-hover: "#2EA03A"
  primary-press: "#24802E"
  primary-soft: "#6EE7B7"
  primary-bg-subdued: "#ECFDF5"
  primary-bg-subdued-hover: "#D1FAE5"
  primary-badge-bg: "#D1FAE5"
  primary-badge-text: "#1C6323"
  ink: "#1C1917"
  ink-secondary: "#78716C"
  ink-tertiary: "#A8A29E"
  ink-on-primary: "#FFFFFF"
  canvas: "#FFFFFF"
  canvas-soft: "#FAFAF9"
  canvas-warm: "#F5F5F4"
  hairline: "#E7E5E4"
  hairline-soft: "#F0EFEE"
  hairline-card-hover: "rgba(60,191,74,0.12)"
  danger: "#EF4444"
  danger-bg: "#FEE2E2"
  danger-text: "#991B1B"
  warning: "#F59E0B"
  warning-bg: "#FEF3C7"
  warning-text: "#92400E"
  success: "#22C55E"
  success-bg: "#DCFCE7"
  info: "#3B82F6"
  info-bg: "#DBEAFE"
  info-text: "#1E40AF"
  sidebar-bg: "#18181B"
  sidebar-text: "#FFFFFF"
  sidebar-active-bg: "rgba(60,191,74,0.2)"
  sidebar-active-text: "#6EE7B7"
  glass-bg: "rgba(255,255,255,0.72)"
  glass-border: "rgba(255,255,255,0.5)"
  glass-dark-bg: "rgba(0,0,0,0.35)"
  glass-dark-border: "rgba(255,255,255,0.08)"

typography:
  display-xxl:
    fontFamily: "Inter_Tight, system-ui, sans-serif"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -1.2px
  display-xl:
    fontFamily: "Inter_Tight, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.8px
  display-lg:
    fontFamily: "Inter_Tight, system-ui, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.64px
  display-md:
    fontFamily: "Inter_Tight, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.48px
  heading-lg:
    fontFamily: "Inter_Tight, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.4px
  heading-md:
    fontFamily: "Inter_Tight, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.36px
  heading-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.02em
  micro:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0
  micro-cap:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: 0.06em
  mono:
    fontFamily: "Geist Mono, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 18px
  xxl: 24px
  pill: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  huge: 32px
  section-v: 64px
  section-v-desktop: 80px
  section-h: 16px
  section-h-tablet: 24px
  section-h-desktop: 32px

shadows:
  xs: "0 1px 2px rgba(0,0,0,0.04)"
  sm: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)"
  md: "0 4px 12px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)"
  lg: "0 8px 24px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.03)"
  xl: "0 16px 40px rgba(0,0,0,0.07), 0 6px 12px rgba(0,0,0,0.03)"
  glow: "0 0 40px rgba(60,191,74,0.12), 0 0 80px rgba(60,191,74,0.06)"
  glow-lg: "0 0 60px rgba(60,191,74,0.15), 0 0 120px rgba(60,191,74,0.05)"
  cta: "0 2px 8px rgba(60,191,74,0.25), inset 0 1px 0 rgba(255,255,255,0.15)"
  cta-hover: "0 6px 20px rgba(60,191,74,0.35)"

animations:
  fadeIn: "fadeIn 0.4s ease-out"
  fadeInUp: "fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1)"
  fadeInDown: "fadeInDown 0.5s cubic-bezier(0.16,1,0.3,1)"
  slideInRight: "slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)"
  scaleIn: "scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)"
  pulseSoft: "pulseSoft 2s ease-in-out infinite"
  shimmer: "shimmer 2s linear infinite"
  transition-fast: "all 0.2s cubic-bezier(0.4,0,0.2,1)"
  transition-base: "all 0.35s cubic-bezier(0.4,0,0.2,1)"

components:
  button-primary:
    background: "{colors.primary-gradient}"
    textColor: "{colors.ink-on-primary}"
    typography: "{typography.body-md}"
    fontWeight: 500
    rounded: "{rounded.md}"
    padding: 10px 20px
    shadow: "{shadows.cta}"
    hover:
      shadow: "{shadows.cta-hover}"
      transform: "translateY(-1px)"
  button-ghost:
    background: transparent
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body-md}"
    fontWeight: 500
    rounded: "{rounded.md}"
    padding: 10px 20px
    hover:
      background: "rgba(0,0,0,0.04)"
      textColor: "{colors.ink}"
  button-outline:
    background: transparent
    textColor: "{colors.primary-press}"
    border: "1px solid rgba(60,191,74,0.2)"
    typography: "{typography.body-md}"
    fontWeight: 500
    rounded: "{rounded.md}"
    padding: 10px 20px
    hover:
      background: "{colors.primary-bg-subdued}"
      borderColor: "{colors.primary-soft}"
  button-danger:
    background: "{colors.danger}"
    textColor: "{colors.ink-on-primary}"
    typography: "{typography.body-md}"
    fontWeight: 500
    rounded: "{rounded.md}"
    padding: 10px 20px
    hover:
      background: "#DC2626"
  button-sm:
    fontWeight: 500
    fontSize: 13px
    padding: 6px 14px
    rounded: 8px
  card-default:
    background: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 24px
    border: "1px solid {colors.hairline}"
    shadow: "{shadows.xs}"
    hover:
      shadow: "{shadows.md}"
      borderColor: "{colors.hairline-card-hover}"
  card-kpi:
    background: "{colors.canvas}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 20px
    border: "1px solid {colors.hairline}"
    shadow: "{shadows.xs}"
    decoration: "linear-gradient(135deg, rgba(60,191,74,0.04), transparent 50%)"
    hover:
      shadow: "{shadows.md}"
      transform: "translateY(-2px)"
  card-glass:
    background: "{colors.glass-bg}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 24px
    border: "1px solid {colors.glass-border}"
    backdropFilter: "blur(16px) saturate(180%)"
    hover:
      transform: "translateY(-4px)"
      shadow: "{shadows.lg}"
  text-input:
    background: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 14px
    border: "1px solid {colors.hairline}"
    placeholder: "{colors.ink-tertiary}"
    focus:
      borderColor: "{colors.primary}"
      shadow: "0 0 0 3px rgba(60,191,74,0.1)"
  badge-green:
    background: "{colors.primary-badge-bg}"
    textColor: "{colors.primary-badge-text}"
    typography: "{typography.micro}"
    fontWeight: 500
    rounded: "{rounded.pill}"
    padding: 2px 10px
  badge-amber:
    background: "{colors.warning-bg}"
    textColor: "{colors.warning-text}"
    fontWeight: 500
    rounded: "{rounded.pill}"
    padding: 2px 10px
  badge-red:
    background: "{colors.danger-bg}"
    textColor: "{colors.danger-text}"
    fontWeight: 500
    rounded: "{rounded.pill}"
    padding: 2px 10px
  badge-blue:
    background: "{colors.info-bg}"
    textColor: "{colors.info-text}"
    fontWeight: 500
    rounded: "{rounded.pill}"
    padding: 2px 10px
  badge-gray:
    background: "{colors.canvas-warm}"
    textColor: "#57534E"
    fontWeight: 500
    rounded: "{rounded.pill}"
    padding: 2px 10px
  nav-sidebar-item:
    background: transparent
    textColor: "{colors.sidebar-text}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    hover:
      background: "rgba(255,255,255,0.06)"
    active:
      background: "{colors.sidebar-active-bg}"
      textColor: "{colors.sidebar-active-text}"
      fontWeight: 600
  table-header:
    background: "{colors.canvas-warm}"
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.micro-cap}"
    padding: 10px 12px
  table-row:
    background: "{colors.canvas}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body-sm}"
    padding: 10px 12px
    borderBottom: "1px solid {colors.hairline-soft}"
    hover:
      background: "rgba(60,191,74,0.03)"
  modal-overlay:
    background: "rgba(0,0,0,0.3)"
    backdropFilter: "blur(4px)"
  modal-content:
    background: "{colors.canvas}"
    rounded: "{rounded.xxl}"
    padding: 24px
    shadow: "{shadows.xl}"
    animation: "{animations.fadeInUp}"
  tab-pill:
    background: transparent
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body-sm}"
    fontWeight: 500
    rounded: "{rounded.md}"
    padding: 6px 14px
    active:
      background: "{colors.canvas}"
      textColor: "{colors.ink}"
      shadow: "{shadows.sm}"
  divider:
    height: 1px
    background: "{colors.hairline}"
  divider-gradient:
    height: 1px
    background: "linear-gradient(90deg, transparent, {colors.hairline}, transparent)"
---

## Overview

WitaLine's design language opens with the green gradient. A smooth linear gradient from `#3CBF4A` through `#2EA03A` to `#1C6323` defines the brand's primary CTA surface — buttons, active tabs, and key interactive elements use this treatment. Type and product UI float above a warm off-white canvas (`#FAFAF9`) on white cards (`#FFFFFF`) with warm-gray borders (`#E7E5E4`). The system pairs Inter Tight (weight 600, negative tracking) for display tiers with Inter (weight 400) for body copy, and uses Geist Mono for technical content like phone numbers, timestamps, and API endpoints.

The color system has two primary roles. **Green** (`#3CBF4A`) is the signature CTA color — one gradient button per section. **Warm gray** (zinc family) is the universal surface and text color, providing a soft, approachable B2B feel. Status colors (red, amber, blue, green) are reserved for badges and semantic indicators.

**Key Characteristics:**
- Warm off-white page background distinguishes the brand from cold #fff-only SaaS.
- Green gradient on primary buttons — the brand's signature interactive treatment, always with an inset highlight and glow shadow.
- Two-type-family hierarchy: Inter Tight (600) for headlines, Inter (400) for body.
- Glass-morphism cards (`rgba(255,255,255,0.72)` with `backdrop-filter: blur(16px) saturate(180%)`) for premium surfaces.
- Dark-zinc sidebar (`#18181B`) with green-active items — the dashboard's distinctive navigation shell.
- Subtle shadows by default (`xs`/`sm`), scaling to `lg`/`xl` for modals and lifted states.
- KPI cards with a diagonal green-tinted gradient overlay.
- Staggered fadeInUp animation sequence for lists and card grids.
- Polish-language marketing pages with English i18n capability.

## Colors

### Brand & Accent
- **Green Primary** (`#3CBF4A`): The brand's signature CTA color. Used for filled buttons, active states, link emphasis, and as the start of the gradient.
- **Green Hover** (`#2EA03A`): Button hover state, secondary brand text.
- **Green Press** (`#24802E`): Pressed state, outline variant.
- **Green Soft** (`#6EE7B7`): Soft brand element, lighter accents.
- **Green BG Subdued** (`#ECFDF5`): Hover backgrounds, tab active bg.
- **Green BG Subdued Hover** (`#D1FAE5`): Badge backgrounds, tint fills.
- **Green Badge Text** (`#1C6323`): Text on green badge backgrounds.

### Surface
- **Canvas** (`#FFFFFF`): Card backgrounds, modals, primary surfaces.
- **Canvas Soft** (`#FAFAF9`): Default page/app background — warm off-white, the brand's signature surface.
- **Canvas Warm** (`#F5F5F4`): Secondary surfaces, table headers, soft backgrounds.
- **Sidebar BG** (`#18181B`): Dashboard sidebar fill (zinc-900).
- **Hairline** (`#E7E5E4`): 1px borders on cards, tables, dividers.
- **Hairline Soft** (`#F0EFEE`): Subtle row dividers, lighter borders.
- **Glass BG** (`rgba(255,255,255,0.72)`): Glass-morphism card backgrounds.
- **Glass Dark BG** (`rgba(0,0,0,0.35)`): Dark glass-morphism backgrounds.

### Text
- **Ink** (`#1C1917`): Headings and primary body text. Warm almost-black.
- **Ink Secondary** (`#78716C`): Body text, secondary information, table cell text.
- **Ink Tertiary** (`#A8A29E`): Placeholder text, captions, helper text.
- **Ink on Primary** (`#FFFFFF`): Text on green and dark surfaces.

### Semantic
- **Danger** (`#EF4444`): Errors, destructive actions, failed badge.
- **Danger BG** (`#FEE2E2`): Danger badge background.
- **Danger Text** (`#991B1B`): Danger badge text.
- **Warning** (`#F59E0B`): Pending states, warnings.
- **Warning BG** (`#FEF3C7`): Warning badge background.
- **Warning Text** (`#92400E`): Warning badge text.
- **Success** (`#22C55E`): Success indicators.
- **Success BG** (`#DCFCE7`): Success badge background.
- **Info** (`#3B82F6`): Informational elements.
- **Info BG** (`#DBEAFE`): Info badge background.
- **Info Text** (`#1E40AF`): Info badge text.

## Typography

### Font Family

The brand uses a two-family system:
- **Inter Tight** (Google Fonts, weight 600) — display and heading tiers. A condensed sans-serif with tight letter-spacing that gives headings their editorial character.
- **Inter** (Google Fonts, weights 400, 500, 600) — body text, UI labels, buttons, all reading-sized content. Clean, highly legible at small sizes.
- **Geist Mono** (Google Fonts, weight 400) — technical content: phone numbers, call durations, API endpoints, timestamps, code.

Fonts are loaded via `next/font/google` and exposed as CSS variables (`--font-inter`, `--font-inter-tight`, `--font-geist-mono`).

### Hierarchy

| Token | Size | Weight | Line H | Letter Spacing | Family | Use |
|---|---|---|---|---|---|---|
| `display-xxl` | 48px | 600 | 1.1 | -1.2px | Inter Tight | Hero headline |
| `display-xl` | 40px | 600 | 1.15 | -0.8px | Inter Tight | Section opener |
| `display-lg` | 32px | 600 | 1.2 | -0.64px | Inter Tight | Feature section title |
| `display-md` | 24px | 600 | 1.25 | -0.48px | Inter Tight | Card title, modal header |
| `heading-lg` | 20px | 600 | 1.3 | -0.4px | Inter Tight | Pricing tier name |
| `heading-md` | 18px | 600 | 1.35 | -0.36px | Inter Tight | Sub-heading |
| `heading-sm` | 16px | 600 | 1.4 | 0 | Inter | Section label, sidebar header |
| `body-lg` | 16px | 400 | 1.6 | 0 | Inter | Marketing body lead |
| `body-md` | 14px | 400 | 1.5 | 0 | Inter | Default UI body, button label |
| `body-sm` | 13px | 400 | 1.4 | 0 | Inter | Table cells, card body |
| `caption` | 12px | 500 | 1.4 | 0.02em | Inter | Table header, helper text |
| `micro` | 11px | 400 | 1.3 | 0 | Inter | Badge text, fine print |
| `micro-cap` | 10px | 600 | 1.15 | 0.06em | Inter | Uppercase eyebrow label |
| `mono` | 13px | 400 | 1.4 | 0 | Geist Mono | Phone, time, API, code |

### Principles
- **Inter Tight at 600 is the brand voice for headings.** Display tiers always use `font-semibold` with negative tracking. The condensed letterforms give the brand its clean, modern editorial feel.
- **Inter at 400 for body.** Reading comfort at small sizes. Leading at 1.5–1.6x for readability.
- **Captions at 500 weight + tracking.** Table headers and small labels get a subtle uppercase tracking to distinguish them from body text.
- **Monospace for technical data.** Phone numbers (`+48 732 125 752`), call durations, timestamps, and API values always use `font-mono` (Geist Mono).
- **No serif.** The brand is exclusively sans-serif.

## Layout

### Spacing System
- **Base unit**: 8px.
- **Section vertical**: 64px mobile, 80px desktop.
- **Section horizontal**: 16px mobile, 24px tablet, 32px desktop.
- **Card internal padding**: 24px (default), 20px (KPI/compact), 32px (premium/feature).
- **Grid gaps**: 16px (default), 24px (feature grids).

### Container Widths

| Container | Max-Width | Used In |
|---|---|---|
| Full page | 1280px (`max-w-7xl`) | Admin, dashboard |
| Feature section | 1152px (`max-w-6xl`) | Marketing sections |
| Pricing | 1024px (`max-w-5xl`) | Pricing section |
| Forms | 768px (`max-w-3xl`) | Settings, editors |
| Auth | 672px (`max-w-2xl`) | Register, login |
| Modals | 512px (`max-w-lg`) | Dialogs |
| Chat | 320px / 82% | Widget bubbles |

### Grid
- Default: `grid gap-4 grid-cols-1`
- Tablet: `sm:grid-cols-2`
- Desktop: `lg:grid-cols-3`

### Whitespace Philosophy
The warm off-white canvas (`#FAFAF9`) provides the breathing room. Content sits on white cards with subtle borders — the card IS the layout unit. Section gaps are generous (64–80px) with content tightening to 16–24px inside cards. The brand avoids dense, wall-to-wall layouts.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat `shadow-xs` | Card default |
| 1 | `shadow-sm` | Hover card default |
| 2 | `shadow-md` | Card hover, active tab |
| 3 | `shadow-lg` | Dropdowns, highlighted elements |
| 4 | `shadow-xl` | Modals, floating panels |
| G | `shadow-glow` | Premium CTA glow |
| G+ | `shadow-glow-lg` | Enhanced glow effect |

### Decorative Depth
The primary depth medium is the **green gradient** on CTAs and the **glass backdrop blur** on premium cards. Shadow is deliberately restrained — the brand communicates clarity and approachability, not weight or opacity.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `xs` | 4px | Small tags, table chrome |
| `sm` | 6px | Form inputs (focus ring) |
| `md` | 10px | Buttons, inputs, tab pills, compact cards |
| `lg` | 14px | Standard cards, pricing cards |
| `xl` | 18px | Feature cards, admin cards, modals |
| `xxl` | 24px | Hero cards, prominent containers |
| `pill` | 9999px | Badges, avatars, toggles |

### Key Relationships
- Cards are always `rounded-xl` (18px) or `rounded-2xl` (24px).
- Buttons are always `rounded-md` (10px) or `rounded-xl` (18px) for large CTAs.
- Badges are always `rounded-full` (pill).
- Modals are always `rounded-2xl` (24px).

## Components

### Buttons

**`button-primary`** — the dominant CTA system-wide.
- Background: green gradient `linear-gradient(135deg, #3CBF4A, #2EA03A)`, text `#FFFFFF`, type `Inter 14px/500`, padding `10px 20px`, rounded `10px`, shadow `0 2px 8px rgba(60,191,74,0.25)` with inset white highlight.
- Hover: deeper shadow `0 6px 20px rgba(60,191,74,0.35)`, translateY(-1px).

**`button-ghost`** — transparent alternative.
- Background transparent, text `#78716C`, same geometry.
- Hover: `background: rgba(0,0,0,0.04)`, text turns `#1C1917`.

**`button-outline`** — bordered alternative.
- Background transparent, text `#24802E`, 1px solid green border at 20% opacity.
- Hover: fills with `#ECFDF5`, border brightens to `#6EE7B7`.

**`button-danger`** — destructive action.
- Background `#EF4444`, text `#FFFFFF`, same geometry.

**Small variant**: `padding: 6px 14px, font-size: 13px, border-radius: 8px`.

### Cards & Containers

**`card-default`** — the workhorse UI container.
- Background `#FFFFFF`, text `#1C1917`, padding `24px`, rounded `18px`, 1px `#E7E5E4` border, `shadow-xs`.
- Hover: `shadow-md`, border shifts to `rgba(60,191,74,0.12)`.

**`card-kpi`** — metric/KPI display.
- Same as default card with a subtle diagonal green overlay (`linear-gradient(135deg, rgba(60,191,74,0.04), transparent 50%)`).
- Hover: lifts 2px.

**`card-glass`** — premium glass morphism.
- Background `rgba(255,255,255,0.72)`, backdrop blur `16px saturate(180%)`, thin white border.
- Used for premium feature highlights, onboarding.
- Hover: lifts 4px with `shadow-lg`.

### Navigation

**Sidebar** — the dashboard identity element.
- Fixed left, width `16rem` (w-64), background `#18181B`.
- Items: `10px 16px`, rounded `10px`, text `#FFFFFF`.
- Hover: `background: rgba(255,255,255,0.06)`.
- Active: `background: rgba(60,191,74,0.2)`, text `#6EE7B7`, font-weight 600.
- Hidden on mobile, visible at `lg:` breakpoint.

**Top Navigation** — utility bar.
- Background `#FFFFFF`, bottom border `1px solid #E7E5E4`, height `4rem`.

### Inputs & Forms

**`text-input`** — standard form field.
- Background `#FFFFFF`, text `#1C1917`, type `Inter 14px`, padding `10px 14px`, rounded `10px`, 1px `#E7E5E4` border.
- Focus: border to `#3CBF4A`, ring `0 0 0 3px rgba(60,191,74,0.1)`.
- Placeholder: `#A8A29E`.

### Badges

Standard collection — `rounded-full`, `2px 10px`, weight 500, size 11px:

| Variant | BG | Text | Use |
|---|---|---|---|
| Green | `#D1FAE5` | `#1C6323` | Active, success, completed |
| Amber | `#FEF3C7` | `#92400E` | Pending, warning |
| Red | `#FEE2E2` | `#991B1B` | Error, failed, blocked |
| Blue | `#DBEAFE` | `#1E40AF` | Info, in-progress |
| Gray | `#F5F5F4` | `#57534E` | Default, neutral |

### Tables

- Wrapper: `bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm`.
- Header: `bg-zinc-50`, text `12px/600 uppercase tracking-wider text-zinc-400`.
- Rows: `13px/400`, `border-b border-zinc-50`, hover `bg-brand-50/50`.
- Standard for admin and dashboard views.

### Modals

- Overlay: `fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center`.
- Content: `bg-white rounded-2xl p-6 max-w-lg shadow-xl animate-fade-in-up`.

### Tab Pills

```
px-4 py-1.5 text-sm font-medium rounded-md transition
Inactive: bg-transparent text-zinc-500 hover:text-zinc-700
Active: bg-white text-zinc-900 shadow-sm
```

### Dividers

Two styles:
- Solid: `border-t border-zinc-200`
- Gradient: `h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent`

## Animations

### Easing Curve
The primary easing for all transitions: `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind default ease).
Enter animations use: `cubic-bezier(0.16, 1, 0.3, 1)` — snappy "overshoot-lite."

### Named Animations
- `fadeIn` — simple opacity 0→1 (0.4s)
- `fadeInUp` — opacity + translateY(16px) → 0 (0.5s) — **most common enter animation**
- `fadeInDown` — opacity + translateY(-12px) → 0 (0.5s) — dropdowns
- `slideInRight` — opacity + translateX(8px) → 0 (0.35s) — mobile sidebar
- `scaleIn` — opacity + scale(0.96) → 1 (0.3s) — modal entrance
- `pulseSoft` — opacity pulse 1→0.65→1 (2s) — live indicators
- `shimmer` — background-position slide (2s) — loading skeletons

### Stagger Pattern
For card grids and lists — each child animates `fadeInUp` with incremental delay (80ms steps, up to 6 children). Applied via the `.stagger` CSS class.

### Loading
Spinner: `w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin`
Skeleton: shimmer animation on a `bg-zinc-100` block with `rounded-md`.

## Do's and Don'ts

### Do
- Reserve brand green for primary CTAs and interactive states — one gradient button per section.
- Use `#FAFAF9` as the default page background, not pure white.
- Use Inter Tight (semibold) for all display/heading tiers — the condensed weight is the brand's typographic signature.
- Use monospace (Geist Mono) for phone numbers, durations, timestamps, and API values.
- Apply `rounded-xl` (18px) to cards and `rounded-md` (10px) to buttons.
- Pair every card with a subtle border and shadow — bare cards feel unfinished.
- Use the stagger fadeInUp pattern for lists and card grids.
- Keep all marketing page text in Polish.

### Don't
- Don't bump display weight above 600 — at 700+ the brand's clean editorial feel collapses.
- Don't use pure `#fff` as the page background — always use `#FAFAF9`.
- Don't use brand green as a body text color — it's for CTAs and interactive elements only.
- Don't replace the rounded-rectangle button shape with pill-shaped buttons.
- Don't add heavy shadows — the brand is approachable, not weighty.
- Don't use serif fonts anywhere.
- Don't use emojis in the UI.
- Don't add inline styles — use Tailwind utility classes.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Wide | ≥ 1280px | Full sidebar, 3+ column grids, max container |
| Desktop | 1024–1280px | Sidebar visible, 3-column feature grids |
| Tablet | 640–1024px | 2-column grids, sidebar hidden (hamburger) |
| Mobile | < 640px | Single column, stacked cards, bottom sheet nav |

### Sidebar Collapsing
- `lg:` and above: sidebar visible as fixed left panel, content offset `lg:ml-64`.
- Below `lg:`: sidebar hidden, accessed via hamburger menu overlay at `z-50`.

### Typography Scaling
- Display tiers stair-step: 48 → 40 → 32 → 24px through breakpoints.
- Body text stays at 14px / 16px regardless of viewport.

### Touch Targets
- All interactive elements: minimum 40px touch target.
- Cards: tap-to-navigate, hover states don't apply on touch.

### Collapsing Strategy
- Pricing tiers: 3-up → 2-up → 1-up.
- Feature grids: 3 columns → 2 → 1.
- Tables: horizontal scroll on mobile, key columns only on very small screens.
- Widget chat: bottom-sheet on mobile, floating panel on desktop.

## Agent Prompt Guide

- **Primary color**: green-400 `#3CBF4A` (brand). Use `bg-brand-400` / `text-brand-400` / `border-brand-400`.
- **Background**: `bg-[#FAFAF9]` (warm off-white) for pages, `bg-white` for cards.
- **Borders**: `border-zinc-200` (default), `border-zinc-100` (subtle).
- **Text**: `text-zinc-900` (headings), `text-zinc-500` (body), `text-zinc-400` (muted).
- **Heading font**: `font-display` (Inter Tight, `font-semibold`).
- **Body font**: `font-sans` (Inter).
- **Card**: `bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm`.
- **Button primary**: `bg-brand-400 text-white px-5 py-2.5 rounded-xl hover:bg-brand-500 transition shadow-lg shadow-brand-500/20`.
- **Button ghost**: `bg-transparent text-zinc-600 px-3 py-2 rounded-lg hover:bg-brand-50 transition`.
- **Input**: `w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200`.
- **Badge**: `text-xs px-2.5 py-1 rounded-full font-medium` with color variant (`bg-brand-50 text-zinc-500`, etc).
- **Table**: wrapper `bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm`.
- **Modal**: overlay `fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center`, content `bg-white rounded-2xl p-6 max-w-lg shadow-xl animate-fade-in-up`.
- **Mutted de-emphasis**: use `text-zinc-400 text-xs`.
- **All marketing text**: Polish language.
- **Animation**: use `animate-fade-in-up` for enter animations, `transition-all duration-200` for hovers.
- **Shadow**: `shadow-sm` (default), `shadow-md` (elevated), `shadow-lg` (CTA), `shadow-xl` (modal).

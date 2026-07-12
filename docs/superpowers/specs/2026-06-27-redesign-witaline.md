# WitaLine Redesign 2026 — Design Spec

**Date:** 2026-06-27
**Status:** Approved (visual mockups validated)
**Next:** Implementation plan

---

## 1. Color System: "Głęboki Granat + Szmaragd" (Option A)

### Rationale
Move away from bright `#3CBF4A` green toward a more premium, B2B-appropriate palette inspired by livespace.io. The deep navy conveys trust and enterprise readiness; teal/emerald accents provide modern, calm energy without being "eco/startup green."

### Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-900` | `#0c1929` | Deepest navy — page backgrounds (dark mode), sidebar, topnav |
| `brand-800` | `#0f1f33` | Surface dark — cards on dark backgrounds |
| `brand-700` | `#14283e` | Card background dark — elevated surfaces |
| `accent` | `#0d9488` | Teal — primary buttons, active states, links |
| `accent-light` | `#14b8a6` | Lighter teal — hover states, highlights |
| `accent-subtle` | `#ccfbf1` | Subtle teal — backgrounds, badges, alerts |
| `surface-light` | `#f8fafc` | Light mode page background |
| `surface-dark` | `#1e293b` | Dark mode elevated surface |

### Dark Mode
- Base: `#0c1929` → `#070f1a` (sidebar/nav even deeper)
- Cards: `#14283e` with subtle `rgba(255,255,255,0.06)` borders
- Text: `#e2e8f0` headings, `#cbd5e1` body, `#94a3b8` secondary
- Accents: `#14b8a6` / `#2dd4bf` on dark backgrounds

---

## 2. Dashboard Layout

### Sidebar
- Fixed width: 200px
- Background: `#0c1929`
- **Submenu support**: grouped sections with uppercase headers ("Główne", "Komunikacja", "Ustawienia"), indented sub-items under parent
- Active item: teal right-border `2px solid #0d9488` + `rgba(13,148,136,0.12)` background
- Hover: `rgba(255,255,255,0.04)` background

### TopNav
- Same background as sidebar (`#0c1929`)
- Left: WitaLine logo/brand mark + breadcrumb-style location + active phone number
- Right: notification bell + user avatar (teal circle with initials)

### Content Area
- Light mode: `#f0f2f5` background
- Dark mode: `#0f1f33` background
- Cards: white (`#fff`) with subtle `box-shadow: 0 1px 2px rgba(0,0,0,0.04)`
- Tables: clean, minimal borders, 11-12px font size

### Stat Cards
- 4-column grid
- Compact: 11px label, 24px value, 11px trend indicator
- Trend up: `#0d9488` | Trend neutral: `#64748b` | Warning: `#eab308`

---

## 3. Landing Page

### Navigation
- Brand mark (teal) + page links (Funkcje, Dla kogo, Cennik, Kontakt)
- Right side: "Zaloguj się" (outline) + "Rozpocznij" (teal primary)
- Background: `#0c1929`

### Hero
- Gradient background: `135deg, #0c1929 → #0f1f33 → #14283e`
- Headline: 42px, 800 weight, white, with teal accent span
- Subtitle: 16px, 60% opacity, max-width 500px
- CTA buttons: Primary (teal) + Outline (white border)
- Trust bar: "Zaufało nam już 150+ firm" with client logos (textual)

### Sections (mockups validated)
1. **"Jak to działa?"** — 3-step process cards (1. Dzwoni klient, 2. Maja rozmawia, 3. Ty widzisz efekty)
2. **"Dla kogo?"** — 6 industry categories in 2-column grid
3. **Cennik** — 3-tier elastic pricing cards with "NAJCZĘŚCIEJ" highlight on middle tier

---

## 4. Component System

### Buttons
| Variant | Style |
|---------|-------|
| Primary | `#0d9488` bg, white text |
| Secondary | `#0c1929` bg, white text |
| Outline | `1px solid #0d9488`, teal text |
| Ghost | `rgba(13,148,136,0.1)` bg, teal text |
| Danger | `#dc2626` bg, white text |
| Pill | Same as primary but `border-radius: 100px` |
| Sizes | Small (6/14), Medium (8/20), Large (12/32) |

### Badges
- Status: Active (green), Pending (yellow), Error (red), Info (indigo) — matching existing patterns
- Tags: Uppercase, small, teal or navy background
- Quality score: bordered pill with dot indicator (`● live 8/10`)

### Inputs
- Standard: `1px solid #e2e8f0`, 6px radius
- Focus: `1px solid #0d9488` + `0 0 0 3px rgba(13,148,136,0.1)` ring
- Placeholder: `#94a3b8`

### Cards
- Basic: white `#fff`, border `#e2e8f0`, subtle shadow
- Dark: `linear-gradient(135deg, #0c1929, #0f1f33)`, white text
- Alert: `#f0fdfa` bg, `1px solid #0d9488` border, with icon + title + description

---

## 5. Mobile Responsiveness

### Breakpoints
- Sidebar collapses to drawer (overlay) below 768px
- Dashboard switches to bottom nav on mobile

### Bottom Nav
- 4 icons: Dashboard, Calls, Chats, Settings
- Active icon: teal, inactive: 30% opacity
- `position: fixed; bottom: 0` with `background: #fff` (light) or `#070f1a` (dark)

### Compact Cards
- Stat cards: 2-column grid instead of 4
- Tables: horizontal scroll or simplified rows
- Font sizes reduce by 1-2px

---

## 6. Implementation Notes

### Tailwind v4
- Define colors in `@theme` block (no config file)
- Dark mode via class strategy (toggle on `<html>`)
- Custom utility for the gradient backgrounds

### Dark Mode Strategy
- CSS custom properties on `:root` and `.dark`
- Each component uses `var(--color-*)` tokens
- Image assets: use `dark:` variant or CSS filters where needed

### Existing Code
- Reuse `AdminLayout`, `DashboardLayout`, `Sidebar`, `TopNav` component shells — restyle them
- `home-page.tsx` client component — replace markup, keep structure
- No new dependencies needed — all achievable with Tailwind utilities

---

## Implementation Order

1. **`globals.css`** — define all color tokens, dark mode vars, component utility classes
2. **`Sidebar.tsx`** + **`TopNav.tsx`** — new styling, submenu support
3. **`AdminLayout.tsx`** / **`DashboardLayout.tsx`** — wire new layouts
4. **Dashboard pages** — stat cards, tables, badges with new tokens
5. **`home-page.tsx`** — landing page hero, sections, pricing in new style
6. **Mobile responsive** — bottom nav, drawer, breakpoint adjustments

## Files to Modify (estimated)

| File | Change |
|------|--------|
| `src/app/globals.css` | New color tokens, dark mode vars, component overrides |
| `src/components/layout/Sidebar.tsx` | Submenu support, new styling |
| `src/components/layout/TopNav.tsx` | New styling |
| `src/components/layout/AdminLayout.tsx` | Use new layout |
| `src/components/layout/home-page.tsx` | New hero, sections, pricing |
| Dashboard page components (stat cards, tables, badges) | Restyled with new tokens |
| `src/app/globals.css` | `@theme` block, dark mode custom properties, component utility classes |

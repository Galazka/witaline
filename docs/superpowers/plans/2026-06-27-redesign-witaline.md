# WitaLine Redesign 2026 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the "Głęboki Granat + Szmaragd" design system to WitaLine's landing page, dashboard layout, and component library.

**Architecture:** Tailwind v4 `@theme` tokens in `globals.css`, reused by all components via `var(--color-*)`. Sidebar/TopNav component shells preserved — only their styling and markup change. Dark mode via `.dark` class on `<html>`.

**Tech Stack:** Next.js 16, Tailwind CSS v4, React 19

## Global Constraints

- All landing page copy in Polish
- No legacy subscription plans — only elastic/pay-as-you-go pricing
- Color system: `#0c1929` (brand-900 deep navy), `#0d9488` (accent teal), teal scale for accents
- Dark mode: class strategy (`.dark` on `<html>`), `#070f1a` for nav/sidebar, `#14283e` for cards
- Existing component shells (`Sidebar.tsx`, `TopNav.tsx`, `AdminLayout.tsx`, `DashboardLayout.tsx`) — preserve interfaces, restyle internals
- No new npm dependencies

---
### Task 1: globals.css — new color tokens + dark mode + component utilities

**Files:**
- Modify: `src/app/globals.css` (entire file)

**Interfaces:**
- Consumes: nothing (foundation layer)
- Produces: `--color-brand-*`, `--color-accent-*`, `--color-surface-*`, dark mode variables, all utility classes

- [ ] **Step 1: Replace `@theme inline` block**

Replace the existing green color tokens and surface tokens with the new granat + szmaragd palette:

```css
@import "tailwindcss";

@theme inline {
  --color-brand-900: #0c1929;
  --color-brand-800: #0f1f33;
  --color-brand-700: #14283e;
  --color-brand-600: #1a3350;
  --color-brand-500: #1e3a5f;
  --color-brand-400: #2d4a6e;
  --color-brand-300: #4a6a8a;
  --color-brand-200: #7a9ab8;
  --color-brand-100: #b0c8dc;
  --color-brand-50: #dce8f0;

  --color-accent: #0d9488;
  --color-accent-light: #14b8a6;
  --color-accent-lighter: #2dd4bf;
  --color-accent-subtle: #ccfbf1;
  --color-accent-bg: #f0fdfa;

  --color-surface: #f8fafc;
  --color-surface-card: #ffffff;
  --color-surface-soft: #f1f5f9;
  --color-surface-dark: #070f1a;
  --color-surface-card-dark: #14283e;
  --color-surface-elevated-dark: #0f1f33;

  --color-border: #e2e8f0;
  --color-border-subtle: #f1f5f9;
  --color-border-dark: rgba(255,255,255,0.06);

  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-text-tertiary: #94a3b8;
  --color-text-dark-primary: #e2e8f0;
  --color-text-dark-secondary: #cbd5e1;
  --color-text-dark-tertiary: #94a3b8;

  --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.03);
  --shadow-xl: 0 16px 40px rgba(0,0,0,0.07), 0 6px 12px rgba(0,0,0,0.03);
  --shadow-glow: 0 0 40px rgba(13,148,136,0.12), 0 0 80px rgba(13,148,136,0.06);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-2xl: 24px;

  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-display: var(--font-inter-tight), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), monospace;

  --animate-fade-in: fadeIn 0.5s ease-out;
  --animate-fade-in-up: fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1);
  --animate-fade-in-down: fadeInDown 0.5s cubic-bezier(0.16,1,0.3,1);
  --animate-slide-in-right: slideInRight 0.35s cubic-bezier(0.16,1,0.3,1);
  --animate-scale-in: scaleIn 0.3s cubic-bezier(0.16,1,0.3,1);
  --animate-pulse-soft: pulseSoft 2s ease-in-out infinite;
  --animate-shimmer: shimmer 2s linear infinite;
}
```

Keep existing `@keyframes` unchanged. Keep `html { scroll-behavior: smooth; }`.

- [ ] **Step 2: Replace body and selection styles**

```css
body {
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.dark body {
  background: var(--color-brand-900);
  color: var(--color-text-dark-primary);
}

::selection { background: rgba(13,148,136,0.18); color: var(--color-brand-900); }

.dark ::selection { background: rgba(13,148,136,0.3); color: #fff; }
```

- [ ] **Step 3: Replace utility classes (glass, card, btn, badge, nav-item, input, etc.)**

```css
.glass { background: rgba(255,255,255,0.72); backdrop-filter: blur(16px) saturate(180%); border: 1px solid rgba(255,255,255,0.5); }
.glass-dark { background: rgba(0,0,0,0.35); backdrop-filter: blur(16px) saturate(180%); border: 1px solid rgba(255,255,255,0.08); }

.glass-card {
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(14px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.35);
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
}
.glass-card:hover {
  box-shadow: 0 8px 28px rgba(0,0,0,0.06);
  border-color: rgba(13,148,136,0.18);
  transform: translateY(-2px);
}

.card {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
}
.card:hover {
  box-shadow: var(--shadow-md);
  border-color: rgba(13,148,136,0.12);
}

.card-kpi {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
}
.card-kpi::before {
  content: "";
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(13,148,136,0.04), transparent 50%);
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
}
.card-kpi:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.card-kpi:hover::before { opacity: 1; }

.dark .card,
.dark .card-kpi {
  background: var(--color-surface-card-dark);
  border-color: var(--color-border-dark);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 14px;
  padding: 10px 20px;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  cursor: pointer;
  line-height: 1.4;
}

.btn-primary {
  background: var(--color-accent);
  color: #fff;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  font-weight: 500;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(13,148,136,0.25), inset 0 1px 0 rgba(255,255,255,0.15);
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.btn-primary:hover { box-shadow: 0 6px 20px rgba(13,148,136,0.35); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover { background: rgba(0,0,0,0.04); color: var(--color-text-primary); }

.dark .btn-ghost { color: var(--color-text-dark-secondary); }
.dark .btn-ghost:hover { background: rgba(255,255,255,0.06); color: var(--color-text-dark-primary); }

.btn-outline {
  background: transparent;
  color: var(--color-accent);
  border: 1px solid rgba(13,148,136,0.2);
  border-radius: var(--radius-md);
  padding: 10px 20px;
  font-weight: 500;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline:hover { background: var(--color-accent-bg); border-color: var(--color-accent-light); }

.btn-sm { padding: 6px 14px; font-size: 13px; border-radius: 8px; }

.input {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 14px;
  background: var(--color-surface-card);
  transition: all 0.2s;
  width: 100%;
  outline: none;
}
.input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
.input::placeholder { color: var(--color-text-tertiary); }

.dark .input {
  background: var(--color-surface-card-dark);
  border-color: var(--color-border-dark);
  color: var(--color-text-dark-primary);
}
.dark .input:focus { border-color: var(--color-accent-light); box-shadow: 0 0 0 3px rgba(13,148,136,0.2); }
.dark .input::placeholder { color: var(--color-text-dark-tertiary); }

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}
.badge-green { background: var(--color-accent-subtle); color: #065f46; }
.badge-amber { background: #FEF3C7; color: #92400E; }
.badge-red { background: #FEE2E2; color: #991B1B; }
.badge-blue { background: #DBEAFE; color: #1E40AF; }
.badge-gray { background: #f1f5f9; color: #475569; }

.dark .badge-green { background: rgba(13,148,136,0.15); color: var(--color-accent-lighter); }
.dark .badge-amber { background: rgba(234,179,8,0.15); color: #fbbf24; }
.dark .badge-red { background: rgba(239,68,68,0.15); color: #fca5a5; }
.dark .badge-blue { background: rgba(59,130,246,0.15); color: #93c5fd; }
.dark .badge-gray { background: rgba(255,255,255,0.08); color: var(--color-text-dark-tertiary); }

.nav-item {
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}
.nav-item:hover { background: rgba(13,148,136,0.06); color: var(--color-accent); }
.nav-item-active { background: var(--color-accent-bg); color: #0f172a; font-weight: 600; border-right: 2px solid var(--color-accent); }

.dark .nav-item { color: var(--color-text-dark-secondary); }
.dark .nav-item:hover { background: rgba(13,148,136,0.1); color: var(--color-accent-light); }
.dark .nav-item-active { background: rgba(13,148,136,0.12); color: #fff; border-right-color: var(--color-accent-light); }

.tab-pill {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.2s;
  white-space: nowrap;
  cursor: pointer;
}
.tab-pill:hover { background: rgba(13,148,136,0.06); color: var(--color-accent); }
.tab-pill-active { background: var(--color-surface-card); color: var(--color-text-primary); box-shadow: var(--shadow-sm); }
.tab-pill-inactive { color: var(--color-text-secondary); }
.tab-pill-inactive:hover { color: var(--color-accent); background: rgba(13,148,136,0.06); }

.dark .tab-pill { color: var(--color-text-dark-secondary); }
.dark .tab-pill-active { background: var(--color-surface-card-dark); color: var(--color-text-dark-primary); }
.dark .tab-pill-inactive { color: var(--color-text-dark-tertiary); }
.dark .tab-pill-inactive:hover { color: var(--color-accent-light); }
.dark .tab-pill:hover { background: rgba(13,148,136,0.1); color: var(--color-accent-light); }
```

- [ ] **Step 4: Replace gradient, glow, and remaining utilities**

```css
.gradient-brand { background: linear-gradient(135deg, var(--color-brand-900), var(--color-brand-800), var(--color-brand-700)); }
.gradient-brand-soft { background: linear-gradient(135deg, var(--color-accent-bg), var(--color-accent-subtle), var(--color-accent-bg)); }
.gradient-text { background: linear-gradient(135deg, var(--color-accent), #065f46); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.gradient-accent { background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light)); }

.glow { box-shadow: var(--shadow-glow); }

.dark .glow { box-shadow: 0 0 40px rgba(13,148,136,0.15), 0 0 80px rgba(13,148,136,0.08); }

.glass-card-dark {
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
}

.divider { height: 1px; background: linear-gradient(90deg, transparent, var(--color-border), transparent); }

.dark .divider { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); }

.stagger > * { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
.stagger > *:nth-child(1) { animation-delay: 0ms; }
.stagger > *:nth-child(2) { animation-delay: 80ms; }
.stagger > *:nth-child(3) { animation-delay: 160ms; }
.stagger > *:nth-child(4) { animation-delay: 240ms; }
.stagger > *:nth-child(5) { animation-delay: 320ms; }
.stagger > *:nth-child(6) { animation-delay: 400ms; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.18); }

.dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
.dark ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }

.font-numeric { font-variant-numeric: tabular-nums; font-feature-settings: "lnum"; }
*:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; border-radius: 4px; }

.skeleton { background: linear-gradient(90deg, var(--color-surface-soft) 25%, var(--color-border) 50%, var(--color-surface-soft) 75%); background-size: 200% 100%; animation: shimmer 2s linear infinite; border-radius: var(--radius-md); }

.dark .skeleton { background: linear-gradient(90deg, var(--color-surface-card-dark) 25%, rgba(255,255,255,0.06) 50%, var(--color-surface-card-dark) 75%); background-size: 200% 100%; }

.bg-surface { background: var(--color-surface-card); }
.bg-surface-secondary { background: var(--color-surface-soft); }
.bg-surface-tertiary { background: var(--color-surface); }
.text-foreground { color: var(--color-text-primary); }
.text-muted { color: var(--color-text-secondary); }
.text-subtle { color: var(--color-text-tertiary); }
.border-surface { border-color: var(--color-border); }
.border-surface-subtle { border-color: var(--color-border-subtle); }

.dark .bg-surface { background: var(--color-surface-card-dark); }
.dark .bg-surface-secondary { background: var(--color-surface-elevated-dark); }
.dark .bg-surface-tertiary { background: var(--color-brand-900); }
.dark .text-foreground { color: var(--color-text-dark-primary); }
.dark .text-muted { color: var(--color-text-dark-secondary); }
.dark .text-subtle { color: var(--color-text-dark-tertiary); }
.dark .border-surface { border-color: var(--color-border-dark); }
.dark .border-surface-subtle { border-color: rgba(255,255,255,0.04); }
```

- [ ] **Step 5: Replace card-modern, pricing, landing-specific utilities**

```css
.glass-pricing { background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.6); box-shadow: 0 8px 40px rgba(0,0,0,0.06); }
.glass-roi { background: linear-gradient(135deg, rgba(204,251,241,0.6), rgba(153,246,228,0.3)); backdrop-filter: blur(12px); border: 1px solid rgba(13,148,136,0.15); box-shadow: 0 4px 24px rgba(13,148,136,0.08); }

.card-modern { background: rgba(255,255,255,0.55); backdrop-filter: blur(14px) saturate(150%); border: 1px solid rgba(255,255,255,0.35); border-radius: var(--radius-lg); box-shadow: 0 1px 3px rgba(0,0,0,0.03); transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.card-modern:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.06); border-color: rgba(13,148,136,0.18); transform: translateY(-2px); }

.card-lift { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.card-lift:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

.input-modern { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px 14px; font-size: 14px; background: var(--color-surface-card); transition: all 0.2s; width: 100%; outline: none; }
.input-modern:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
.input-modern::placeholder { color: var(--color-text-tertiary); }

.btn-primary-old { background: linear-gradient(135deg, var(--color-accent), #0f766e); color: #fff; border-radius: var(--radius-md); padding: 10px 20px; font-weight: 500; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; line-height: 1.4; box-shadow: 0 2px 8px rgba(13,148,136,0.25); transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.btn-primary-old:hover { box-shadow: 0 6px 20px rgba(13,148,136,0.35); transform: translateY(-1px); }

.input-dark { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-md); padding: 10px 14px; font-size: 14px; color: #fff; }
.input-dark:focus { outline: none; border-color: var(--color-accent-light); box-shadow: 0 0 0 3px rgba(13,148,136,0.2); }
.input-dark::placeholder { color: rgba(255,255,255,0.4); }

.gradient-text-light { background: linear-gradient(135deg, var(--color-accent-light), var(--color-accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.glow-brand { box-shadow: 0 0 60px rgba(13,148,136,0.15), 0 0 120px rgba(13,148,136,0.05); }

.nav-modern { background: rgba(255,255,255,0.68); backdrop-filter: blur(16px) saturate(200%); border-bottom: 1px solid rgba(0,0,0,0.06); }

.animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
.animate-slide-in { animation: slideInRight 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
.animate-pulse-soft { animation: pulseSoft 2s ease-in-out infinite; }
```

Keep all existing `@keyframes` blocks unchanged.

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: exit code 0, no errors

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css
git commit -m "style: redesign color system — granat + szmaragd, dark mode support"
```

---

### Task 2: Sidebar.tsx — restyle to dark granat theme

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: color tokens from Task 1 (`var(--color-*)`, `.nav-item`, `.nav-item-active`)
- Produces: dark sidebar with `#0c1929` background, teal active indicator

- [ ] **Step 1: Replace sidebar wrapper classes**

Replace `aside` element classes:

Old:
```tsx
className={`fixed left-0 top-0 h-screen bg-white/90 backdrop-blur-lg border-r border-zinc-200/60 z-50 flex flex-col transition-all duration-300 ${
  collapsed ? "w-16" : "w-64"
}`}
```

New:
```tsx
className={`fixed left-0 top-0 h-screen bg-[#0c1929] border-r border-white/5 z-50 flex flex-col transition-all duration-300 ${
  collapsed ? "w-16" : "w-64"
}`}
```

- [ ] **Step 2: Replace header/logo section**

Replace `div` with logo classes. Old:

```tsx
<div className="h-16 flex items-center px-4 border-b border-zinc-100/60">
  {logo || (
    <Link href="/" className="flex items-center gap-3">
      <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-sm shadow-brand-200/40 shrink-0">
        <span className="text-white text-xs font-bold">W</span>
      </div>
      {!collapsed && (
        <span className="text-base font-bold text-zinc-800 font-display tracking-tight">WitaLine</span>
      )}
    </Link>
  )}
  <button
    onClick={() => setCollapsed(!collapsed)}
    className="ml-auto p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-300 hidden lg:block transition-colors"
  >
    {collapsed ? <IconChevronLeft className="w-4 h-4" /> : <IconChevronDown className="w-4 h-4 rotate-90" />}
  </button>
</div>
```

New:
```tsx
<div className="h-16 flex items-center px-4 border-b border-white/5">
  {logo || (
    <Link href="/" className="flex items-center gap-3">
      <div className="w-8 h-8 bg-[#0d9488] rounded-xl flex items-center justify-center shrink-0">
        <span className="text-white text-xs font-bold">W</span>
      </div>
      {!collapsed && (
        <span className="text-base font-bold text-white/90 font-display tracking-tight">WitaLine</span>
      )}
    </Link>
  )}
  <button
    onClick={() => setCollapsed(!collapsed)}
    className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-white/30 hidden lg:block transition-colors"
  >
    {collapsed ? <IconChevronLeft className="w-4 h-4" /> : <IconChevronDown className="w-4 h-4 rotate-90" />}
  </button>
</div>
```

- [ ] **Step 3: Replace nav-item styles in NavItem component**

Replace the button `className` in the NavItem component (line ~51):

Old:
```tsx
className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
  active
    ? "bg-brand-50/80 text-brand-700"
    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
}`}
```

New:
```tsx
className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
  active
    ? "bg-[#0d9488]/10 text-[#14b8a6]"
    : "text-white/50 hover:bg-white/5 hover:text-white/80"
}`}
```

Replace the active bar indicator:
Old: `bg-brand-400` → New: `bg-[#0d9488]`

Replace the bottom border:
Old: `border-t border-zinc-100/60` → New: `border-t border-white/5`

Replace the submenu border:
Old: `border-l border-zinc-100` → New: `border-l border-white/10`

Replace the badge classes:
Old: `bg-brand-100 text-brand-700` → New: `bg-[#0d9488]/20 text-[#14b8a6]`

Replace the collapse button:
Old: `hover:bg-zinc-100 text-zinc-300` → New: `hover:bg-white/5 text-white/30`

Replace the nav container:
Old: `bg-white/90 backdrop-blur-lg` → not needed (removed from aside)

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: exit code 0

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "style: sidebar dark granat theme with teal accent"
```

---

### Task 3: TopNav.tsx — restyle to match sidebar

**Files:**
- Modify: `src/components/layout/TopNav.tsx`

**Interfaces:**
- Consumes: color tokens from Task 1
- Produces: dark topnav with `#0c1929` background, matching sidebar

- [ ] **Step 1: Replace header wrapper classes**

Old:
```tsx
<header className="h-16 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 sticky top-0 z-40">
```

New:
```tsx
<header className="h-16 bg-[#0c1929] border-b border-white/5 sticky top-0 z-40">
```

- [ ] **Step 2: Replace title colors**

Old:
```tsx
<h1 className="text-[15px] font-semibold text-zinc-800 truncate">{title}</h1>
{subtitle && <p className="text-xs text-zinc-400 truncate -mt-0.5">{subtitle}</p>}
```

New:
```tsx
<h1 className="text-[15px] font-semibold text-white/90 truncate">{title}</h1>
{subtitle && <p className="text-xs text-white/40 truncate -mt-0.5">{subtitle}</p>}
```

- [ ] **Step 3: Replace menu toggle button**

Old:
```tsx
<button onClick={onMenuToggle} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors">
```

New:
```tsx
<button onClick={onMenuToggle} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white/5 text-white/40 transition-colors">
```

- [ ] **Step 4: Replace user section**

Old:
```tsx
<div className="flex items-center gap-2 pl-3 border-l border-zinc-200/60">
  <div className="w-8 h-8 bg-gradient-to-br from-brand-100 to-brand-50 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
    <IconUser className="w-4 h-4 text-brand-600" />
  </div>
  <div className="hidden md:block text-xs leading-tight">
    <p className="font-medium text-zinc-600 truncate max-w-[120px]">{userEmail}</p>
  </div>
  <button onClick={onLogout} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-colors" title="Wyloguj">
```

New:
```tsx
<div className="flex items-center gap-2 pl-3 border-l border-white/10">
  <div className="w-8 h-8 bg-[#0d9488] rounded-full flex items-center justify-center ring-2 ring-[#0c1929]">
    <IconUser className="w-4 h-4 text-white" />
  </div>
  <div className="hidden md:block text-xs leading-tight">
    <p className="font-medium text-white/60 truncate max-w-[120px]">{userEmail}</p>
  </div>
  <button onClick={onLogout} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors" title="Wyloguj">
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: exit code 0

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/TopNav.tsx
git commit -m "style: topnav dark granat theme"
```

---

### Task 4: Dashboard pages — restyle stat cards, tables, badges

**Files:**
- Modify: All dashboard and admin pages that use stat cards, tables, badges with green brand references

**Interfaces:**
- Consumes: updated `globals.css` utility classes (`.card-kpi`, `.badge-*`, `.btn-*`, `.tab-pill-*`)
- Produces: consistently styled dashboard pages in new color scheme

- [ ] **Step 1: Find all green brand class references in dashboard pages**

Run: `rg "brand-|#3CBF4A|from-brand|to-brand|bg-brand|text-brand|border-brand" src/app/dashboard/ src/app/admin/ --include "*.tsx" --include "*.tsx" -l`

Expected: list of files that still reference old green brand classes

- [ ] **Step 2: Replace brand-* classes with translated equivalents**

For each file found:

| Old Class | New Class |
|-----------|-----------|
| `bg-brand-50` | `bg-accent-bg` (or `bg-[#0d9488]/10`) |
| `text-brand-700` | `text-accent` (or `text-[#0d9488]`) |
| `text-brand-600` | `text-accent` |
| `from-brand-400` | `from-[#0d9488]` |
| `to-brand-600` | `to-[#0f766e]` |
| `ring-brand-200` | `ring-[#0d9488]/20` |
| `shadow-brand-200/40` | `shadow-[#0d9488]/10` |
| `border-brand-200` | `border-[#0d9488]/20` |
| `hover:bg-brand-50` | `hover:bg-[#0d9488]/10` |

For each occurrence, replace:

Old pattern:
```
bg-brand-50/80 text-brand-700 shadow-sm
```

New pattern:
```
bg-[#0d9488]/10 text-[#14b8a6]
```

Old brand gradient badge:
```
bg-gradient-to-br from-brand-400 to-brand-600
```

New solid badge:
```
bg-[#0d9488]
```

- [ ] **Step 3: Check table styling**

Search for table-related classes that reference old brand:
Run: `rg "brand-" src/app/dashboard/ --include "*.tsx"`

Replace table `#3CBF4A` references with `#0d9488` across all dashboard tables. Focus on:
- Status badges (green/amber/red) — these use `.badge-green` etc. which are already updated in Task 1
- Any inline tailwind that uses brand hex codes

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: exit code 0

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/ src/app/admin/
git commit -m "style: dashboard and admin pages — granat theme"
```

---

### Task 5: Landing page (home-page.tsx) — redesign

**Files:**
- Modify: `src/components/layout/home-page.tsx`

**Interfaces:**
- Consumes: color tokens from Task 1, component utilities
- Produces: landing page with new hero, sections, pricing in granat + szmaragd

- [ ] **Step 1: Read current home-page.tsx**

Run: `cat src/components/layout/home-page.tsx`

Expected: 911-line component with current green branding

- [ ] **Step 2: Replace navigation bar**

Replace the nav bar background and link colors:

Old patterns:
```
bg-white/80 backdrop-blur-xl border-b border-zinc-200/50
text-brand-600
bg-brand-50 text-brand-700
from-brand-400 to-brand-600
```

New:
```
bg-[#0c1929] border-b border-white/5
text-[#14b8a6]
bg-[#0d9488]/10 text-[#14b8a6]
#0d9488 solid
```

- [ ] **Step 3: Replace hero section**

Replace the hero gradient and colors:

Old:
```
from-brand-900 via-brand-800 to-brand-950
text-brand-400
gradient-text
bg-gradient-to-br from-brand-400 to-brand-600
```

New:
```
135deg, #0c1929 → #0f1f33 → #14283e
text-[#14b8a6]
gradient-text (uses accent now from Task 1)
bg-[#0d9488]
```

- [ ] **Step 4: Replace trust bar, how-it-works, industry, and pricing sections**

Apply the same color mapping:
- All `brand-*` → use `[#0d9488]` or new semantic classes
- All green `#3CBF4A` → `#0d9488`
- All green gradients → teal gradients
- Section backgrounds stay as-is (light/dark sections)

- [ ] **Step 5: Add dark mode toggle to the nav**

Add a sun/moon icon button in the nav bar:

```tsx
const [darkMode, setDarkMode] = useState(false);

useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [darkMode]);

// In nav actions:
<button
  onClick={() => setDarkMode(!darkMode)}
  className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
  aria-label="Toggle dark mode"
>
  {darkMode ? '☀️' : '🌙'}
</button>
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: exit code 0

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/home-page.tsx
git commit -m "feat: landing page redesign — granat hero, teal accents, dark mode toggle"
```

---

### Task 6: Mobile responsive — bottom nav, drawer, breakpoints

**Files:**
- Modify: `src/components/layout/Sidebar.tsx` (add mobile drawer behavior)
- Modify: `src/components/layout/TopNav.tsx` (ensure hamburger works)
- Modify: `src/app/dashboard/layout.tsx` (responsive layout wrapper)
- Modify: `src/app/admin/layout.tsx` (responsive layout wrapper)

**Interfaces:**
- Consumes: existing Sidebar and TopNav component interfaces
- Produces: mobile-responsive dashboard with bottom nav or drawer

- [ ] **Step 1: Add mobile drawer to Sidebar**

Add a mobile overlay when sidebar is open on small screens. Add to the aside element wrapper:

```tsx
// Before the aside element, add overlay for mobile
{!collapsed && (
  <div
    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
    onClick={() => setCollapsed(true)}
  />
)}

// Add responsive class to aside:
className={`fixed left-0 top-0 h-screen bg-[#0c1929] border-r border-white/5 z-50 flex flex-col transition-all duration-300 ${
  collapsed ? "-translate-x-full lg:w-16 lg:translate-x-0" : "w-64 lg:w-64"
}`}
```

- [ ] **Step 2: Add mobile bottom nav**

Create a new minimal mobile bottom nav component inline in the layout, or as a separate file:

```tsx
// MobileBottomNav.tsx
export default function MobileBottomNav({ activeKey, onNavigate }: { activeKey: string; onNavigate: (key: string) => void }) {
  const items = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'calls', icon: '📞', label: 'Połączenia' },
    { key: 'conversations', icon: '💬', label: 'Rozmowy' },
    { key: 'settings', icon: '⚙️', label: 'Ustawienia' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0c1929] border-t border-white/5 z-50 lg:hidden">
      <div className="flex">
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] transition-colors ${
              activeKey === item.key ? 'text-[#14b8a6]' : 'text-white/30'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Add bottom padding to layout wrappers**

In `src/app/dashboard/layout.tsx` and `src/app/admin/layout.tsx`, add `pb-16 lg:pb-0` to the main content container to account for bottom nav.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: exit code 0

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/TopNav.tsx src/components/layout/MobileBottomNav.tsx src/app/dashboard/layout.tsx src/app/admin/layout.tsx
git commit -m "feat: mobile responsive — sidebar drawer, bottom nav"
```

---

### Task 7: Final build check and fix

**Files:**
- Modify: any remaining files with old brand references

- [ ] **Step 1: Full grep for old green references**

Run: `rg "#3CBF4A|#2EA03A|#24802E|#1C6323|#14461A|#0D3312" src/ --include "*.tsx" --include "*.ts" --include "*.css"`

Expected: no remaining old green hex values

- [ ] **Step 2: Check for green shadow references**

Run: `rg "rgba\(60,191,74|rgba\(46,160,58" src/ --include "*.tsx" --include "*.ts" --include "*.css"`

Expected: no remaining green shadow references

- [ ] **Step 3: Fix any remaining old green references**

Replace any remaining old green references with teal equivalents.

- [ ] **Step 4: Final build**

Run: `npm run build`
Expected: exit code 0

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove legacy green brand references, finalize redesign"
```

---

## Self-Review Checklist

1. **Spec coverage:** Every section in the design spec has a corresponding task:
   - Color system → Task 1
   - Dashboard layout (Sidebar + TopNav) → Tasks 2-3
   - Dashboard pages (cards, tables, badges) → Task 4
   - Landing page → Task 5
   - Mobile responsiveness → Task 6
   - Dark mode → Task 1 (globals) + each component's dark classes
   - Component system → Task 1 (utility classes)

2. **Placeholder scan:** No TBD, TODO, or incomplete steps found.

3. **Type consistency:** All component interfaces preserved — no signature changes between tasks.

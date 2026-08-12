---
type: layout-components
title: Layout Components
description: Shared layout chrome — BrandLogo, Logo mark, Footer, LanguageSwitcher, ThemeToggle, and ScrollToTop.
tags: [layout, logo, footer, language-switcher, theme-toggle, scroll-to-top]
---

# Layout Components

These components form the shared chrome visible across all routes: the brand logo, footer, language switcher, theme toggle, and scroll-to-top utility.

## BrandLogo (`src/components/layout/BrandLogo.tsx`)

The FRC#8020 "Cyberpunk" wordmark as a PNG image. Theme-aware: swaps between the black-on-transparent (light) and white-on-transparent (dark) variants.

```tsx
export function BrandLogo({ height = 26 }: BrandLogoProps) {
  const { theme } = useTheme()
  return (
    <img
      src={theme === 'dark' ? logoDark : logoLight}
      alt="Cyberpunk"
      height={height}
      style={{ height, width: 'auto', display: 'block' }}
    />
  )
}
```

The wordmark uses static PNG assets from `src/assets/`. The `height` prop controls the rendered size; width scales proportionally.

## Logo (`src/components/layout/Logo.tsx`)

A pure CSS/SVG mark: a step response curve blueprint icon (acceleration line → velocity ramp → steady state with dot) plus the "CyberAcademi**K**" wordmark where the K is accent-colored.

```svg
<rect width="100" height="100" rx="22" fill="var(--bg-block)" stroke="var(--line)" />
<path d="M28 70 C 44 70, 44 30, 70 30" stroke="var(--ac1)" />  <!-- step response -->
<line x1="28" y1="30" x2="28" y2="70" stroke="var(--tx-5)" />   <!-- y-axis -->
<line x1="28" y1="70" x2="72" y2="70" stroke="var(--tx-5)" />   <!-- x-axis -->
<circle cx="70" cy="30" r="5.5" fill="var(--ac1b)" />           <!-- response endpoint -->
```

Used in the 404 page and other compact contexts where the PNG wordmark doesn't fit.

| Prop | Default | Notes |
|------|---------|-------|
| `size` | `30` | SVG viewBox size, also controls wordmark font size |
| `markOnly` | `false` | When true, only shows the SVG step-response mark |

## Footer (`src/components/layout/Footer.tsx`)

Appears at the bottom of every page. Displays:
- "Course content by FRC#8020 Mentors & Members"
- "CyberAcademiK · tutorial site by Nathan Lee"
- "© 2026 CyberAcademiK · FRC Learning Library"
- "Mechanical · Electrical · Control"

All text comes from `useI18n()` via the `Strings` interface (`footerContentBy`, `footerSiteBy`, `footerCopyright`, `footerDisciplines`).

## LanguageSwitcher (`src/components/layout/LanguageSwitcher.tsx`)

A segmented control displaying the two locale labels (`"EN"` / `"繁"`) as small buttons. The active locale is highlighted with accent-colored background and text.

```tsx
{LOCALES.map((loc) => (
  <button key={loc} onClick={() => setLocale(loc)}
    aria-pressed={loc === locale}
    title={LOCALE_NAMES[loc]}>
    {LOCALE_LABELS[loc]}
  </button>
))}
```

## ThemeToggle (`src/components/layout/ThemeToggle.tsx`)

A small sun/moon icon button that toggles between light and dark modes.

```tsx
<button onClick={toggleTheme} title={t.toggleTheme}>
  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
</button>
```

## ScrollToTop (`src/components/ScrollToTop.tsx`)

A no-render component that resets scroll to the top on every route change:

```tsx
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return null
}
```

Placed at the top of the route `<Routes>` so it runs before any route component mounts.

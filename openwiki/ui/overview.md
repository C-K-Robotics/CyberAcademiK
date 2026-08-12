---
type: ui-overview
title: UI Overview
description: The application shell of CyberAcademiK — entry point, provider hierarchy, theme system, CSS architecture, and canvas palette design.
tags: [ui, shell, theme, providers, css, canvas]
---

# UI Overview

The application shell is the thin layer that wraps all route content with global providers (theme, i18n), layout chrome (topbar, sidebar), and the CSS foundation.

## Entry point (`src/main.tsx`)

```tsx
createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider>        // ← 1. Theme (light/dark)
      <I18nProvider>        // ← 2. Internationalisation
        <App />             // ← 3. Routes
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
```

The provider nesting order is intentional:
1. **`ThemeProvider`** is outermost — it sets `data-theme` on `<html>`, so the `<head>` CSS tokens are available to all child providers.
2. **`I18nProvider`** is second — locale affects string rendering inside both theme-related UI (e.g. toggle label) and content UI.
3. **`App`** is innermost — it renders the router, which renders route components that use both contexts.

## Theme system

| Layer | File | Purpose |
|-------|------|---------|
| **Provider** | `src/theme/ThemeProvider.tsx` | React context, localStorage persistence, `useTheme()` hook |
| **Palette** | `src/theme/palette.ts` | Theme-mirrored color values for canvas 2D context, `usePalette()` hook |
| **CSS tokens** | `src/styles/theme.css` | CSS custom properties for light/dark, 6 accent colors, typography scale |

The CSS custom properties (light theme defaults):

| Variable | Example value | Purpose |
|----------|---------------|---------|
| `--bg-deep` | `#c5d0d9` | Deepest background |
| `--tx-strong` | `#15232c` | Primary text color |
| `--ac1` | `#0a7d8f` | Accent 1 (teal) |
| `--ac2` | `#6b46c1` | Accent 2 (purple) |
| `--ac3` | `#c43e74` | Accent 3 (pink) |
| `--ac4` | `#0e9d63` | Accent 4 (green) |
| `--ac5` | `#d23048` | Accent 5 (red) |
| `--ac6` | `#b07c08` | Accent 6 (amber) |

Dark mode is activated by `[data-theme='dark']` on `<html>`, which overrides all token values.

## Canvas palette (`src/theme/palette.ts`)

Canvas 2D context cannot read CSS custom properties cheaply. The palette module mirrors accent and neutral colors into a typed `Palette` interface, keyed by theme:

```ts
interface Palette {
  label: string; axis: string; grid: string; track: string
  strong: string; dim: string; tick: string; setpoint: string
  ac1: string; ac3: string; ac4: string; ac5: string; ac2line: string
  // ... more for PID-specific visual elements
}
```

Canvas components use the `usePalette()` hook to get the current theme's palette and re-render when the theme changes.

## CSS architecture

| File | Scope | Type |
|------|-------|------|
| `src/styles/theme.css` | Global | CSS custom property tokens, body reset, scrollbar, range input, selection |
| `src/components/home/home.css` | Home page | 3-column grid, card hover transitions, responsive breakpoints |
| `src/components/course/course.css` | Course reader | Sidebar collapse/drawer, chip nav, responsive |
| `src/components/search/CourseSearch.css` | Search | Panel positioning, highlight styles |
| `src/mdx/mdx.css` | MDX content | Component-specific overrides (code tabs, quiz, prose links, lesson sections) |

Component styles are predominantly inline (object-style `CSSProperties`), with only animation, hover, responsive, and pseudo-element rules moved to `.css` files. This keeps visual rules in one place while dynamic values (colors, sizes based on props) stay inline.

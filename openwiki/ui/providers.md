---
type: providers
title: Providers (Theme & Internationalisation)
description: The ThemeProvider and I18nProvider React contexts, their persistence strategies, and the strings/i18n type system.
tags: [providers, theme, i18n, context, internationalisation]
---

# Providers (Theme & Internationalisation)

CyberAcademiK uses two React contexts for global state: theme selection and locale. Both persist their values to `localStorage` and are consumed via typed hooks.

## ThemeProvider (`src/theme/ThemeProvider.tsx`)

### Interface

```ts
interface ThemeContextValue {
  theme: ThemeName       // "light" | "dark"
  setTheme: (t: ThemeName) => void
  toggleTheme: () => void
}
```

### Initialisation

```ts
function readInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'light'   // SSR safety
  const stored = window.localStorage.getItem(STORAGE_KEY)  // "cyberacademik:theme"
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
```

The theme is read in this order:
1. **localStorage** — user's previous selection
2. **`prefers-color-scheme`** — OS-level preference
3. **"light"** — default

### Behaviour

- Sets `data-theme` attribute on `<html>` on every change
- Stores value in `localStorage` on every change (ignores storage failures — private mode, quota exceeded)
- `toggleTheme()` flips between "light" and "dark" without needing to know the current value

### Consumer hook

```ts
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
```

## I18nProvider (`src/i18n/I18nProvider.tsx`)

### Interface

```ts
interface I18nContextValue {
  locale: Locale         // "en" | "zh-Hant"
  setLocale: (l: Locale) => void
  t: Strings             // Localised string map for current locale
}
```

### Initialisation

```ts
function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const stored = window.localStorage.getItem(STORAGE_KEY)  // "cyberacademik:locale"
  if (isLocale(stored)) return stored
  // Fall back to the browser's preference if it is Traditional Chinese
  const nav = window.navigator?.language?.toLowerCase() ?? ''
  if (nav.startsWith('zh') && (nav.includes('hant') || nav.includes('tw') || nav.includes('hk'))) {
    return 'zh-Hant'
  }
  return DEFAULT_LOCALE  // "en"
}
```

Locale detection priority:
1. **localStorage** — user's previous selection
2. **Browser language** — `navigator.language` for zh-Hant/zh-TW/zh-HK
3. **English** — default

### Behaviour

- Sets `document.documentElement.lang` attribute to match the active locale
- Stores locale in `localStorage` on every change (ignores failures)
- The `setLocale` function uses `useCallback` to stay referentially stable

### Consumer hook

```ts
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}
```

## Strings system (`src/i18n/strings.ts`)

### `Strings` interface

70+ UI label strings defined as either literals or format functions:

```ts
interface Strings {
  brandTagline: string
  searchPlaceholder: string
  searchNoResults: (query: string) => string
  heroTitle: string
  heroLead: string
  coursesSubteamsMeta: (courses: number, subteams: number) => string
  lessonCounter: (n: string, total: string) => string
  quizScore: (correct: number, total: number) => string
  // ... 40+ more strings
}
```

Format functions (those taking parameters) are called in the component code, not inside the string object, keeping the locale data as plain serializable data.

### Locale map

```ts
export const STRINGS: Record<Locale, Strings> = {
  en,
  'zh-Hant': zhHant,
}
```

## Format utilities (`src/i18n/format.ts`)

| Function | Purpose |
|----------|---------|
| `formatMinutes(minutes: number, locale: Locale)` | Returns `"25 min"` or `"25 分鐘"` |
| `pad2(n: number)` | Returns two-digit string, e.g. `3` → `"03"` |

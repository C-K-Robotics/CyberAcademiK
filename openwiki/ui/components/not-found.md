---
type: not-found-page
title: 404 Page
description: The not-found (404) fallback page with the step-response logo mark, message, and back-to-library link.
tags: [not-found, error-page]
---

# 404 Page

The 404 page (`*` catch-all route) displays a centered error screen with the CyberAcademiK logo mark, a "Page not found" message, and a back-to-library link.

## Component (`src/components/NotFound.tsx`)

```tsx
export function NotFound() {
  const { t } = useI18n()
  return (
    <div className="app-grid" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, textAlign: 'center' }}>
      <Logo size={40} />
      <h1 style={{ fontSize: 30, fontWeight: 700, margin: '12px 0 0' }}>{t.notFoundTitle}</h1>
      <p style={{ color: 'var(--tx-2)', margin: 0 }}>{t.notFoundBody}</p>
      <Link to="/" style={{ fontFamily: "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace", fontSize: 13, color: 'var(--ac1)', border: '1px solid rgba(var(--ac1-rgb),0.45)', background: 'rgba(var(--ac1-rgb),0.08)', padding: '9px 16px', borderRadius: 9 }}>
        ← {t.backToLibrary}
      </Link>
    </div>
  )
}
```

### Logo mark

Uses the inline SVG step-response mark (`Logo` component from `src/components/layout/Logo.tsx`) at 40px, without the wordmark (`markOnly` default).

### Translated strings

- `t.notFoundTitle` → "Page not found" / "找不到頁面"
- `t.notFoundBody` → "We couldn't find what you were looking for." / "我們找不到您要的內容。"
- `t.backToLibrary` → "Back to the library" / "返回資料庫"

### Route registration

Registered as the catch-all `*` route in `App.tsx`:

```tsx
<Route path="*" element={<NotFound />} />
```

This matches any URL not handled by the three named routes (`/`, `/subteams/:id`, `/courses/:slug`).

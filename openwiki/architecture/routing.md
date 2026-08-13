---
type: routing
title: Routing
description: React Router configuration for CyberAcademiK — four routes mapped under a GitHub Pages sub-path basename.
tags: [routing, react-router, spa, github-pages]
---

# Routing

CyberAcademiK uses React Router v6 (`react-router-dom`) with a `basename` derived from `import.meta.env.BASE_URL` (stripped of trailing slash) so it works correctly as both a local dev server and a GitHub Pages project site.

## Route definitions (`src/App.tsx`)

```tsx
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/subteams/:id" element={<SubteamPage />} />
        <Route path="/courses/:slug" element={<CoursePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
```

## Route map

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | Library home: hero section + 3-column subteam cards |
| `/subteams/:id` | `SubteamPage` | Category detail page — looks up subteam by `id` param, renders `CategoryDetail` or falls through to `NotFound` |
| `/courses/:slug` | `CoursePage` | Lesson reader — looks up course module by `slug`, renders `CourseLayout` or falls through to `NotFound` |
| `*` | `NotFound` | 404 page with logo and back-to-library link |

## SPA deep-link support

The GitHub Pages deployment copies `dist/index.html` to `dist/404.html` in the CI workflow (`.github/workflows/deploy.yml`). Because GitHub Pages serves `404.html` for any unmatched path, client-side routing works for deep links like `/courses/pid-control` — the SPA shell loads and React Router resolves the route correctly.

## Shared routing utilities

| Component | Role |
|-----------|------|
| `src/components/ScrollToTop.tsx` | Resets `window.scrollTo(0)` on every `pathname` change (via `useLocation`) |
| `src/components/course/ChipNav.tsx` | Uses `IntersectionObserver` to highlight active section — does NOT use router, but provides scroll-to-section functionality |

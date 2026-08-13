---
type: home-page
title: Home Page
description: The library home page — hero section with site intro, 3-column category card grid, sticky topbar with subteam navigation, and footer.
tags: [home, library, category-cards, hero, subteam-nav]
---

# Home Page

The home page (`/`) is the library's entry point, showing the site's tagline and a grid of subteam cards that link to category detail pages.

## Component tree

```
Home (Home.tsx)
├── HomeHeader (topbar)
│   ├── BrandLogo (wordmark image, theme-aware)
│   ├── Subteam nav links (one per category)
│   ├── CourseSearch
│   ├── LanguageSwitcher
│   └── ThemeToggle
├── Hero (headline section)
├── CategoryCard grid (3 per row)
│   └── [CategoryCard for each subteam]
└── Footer (attribution + copyright)
```

## Home component (`src/components/home/Home.tsx`)

The root layout uses a flex column with `min-height: 100vh`. Inside, `hm-home-wrap` provides max-width and padding. The category grid uses CSS grid (`repeat(3, 1fr)`) defined in `home.css`.

```tsx
export function Home() {
  return (
    <div className="app-grid" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HomeHeader />
      <div style={{ flex: 1 }}>
        <div className="hm-home-wrap">
          <Hero />
          <div className="hm-catgrid">
            {SUBTEAMS.map((subteam, i) => (
              <CategoryCard key={subteam.id} subteam={subteam} index={i} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
```

## Hero section (`src/components/home/Hero.tsx`)

The hero displays:
- A red-kicker label (`CYBERACADEMIK · LEARNING LIBRARY`) in monospace
- A 52px headline ("Build the whole robot, one skill at a time.")
- A lead paragraph (two sentences, max 600px wide)
- A "BROWSE SUBTEAMS" label and a metadata count line (`{N} courses · {N} subteams`)

The counts come from `TOTAL_COURSES` and `TOTAL_SUBTEAMS` which are derived at runtime from the discovered catalog.

## Category cards (`src/components/home/CategoryCard.tsx`)

Each subteam card links to its detail page (`/subteams/<id>`) and displays:

1. **Icon box** — 46×46 rounded square with the category's Lucide icon, accent color, and accent-colored border/background
2. **Numbered index** — two-digit pad (01, 02, 03)
3. **Localized title** — in the active locale
4. **Blurb paragraph** — short description
5. **Tag pills** — small bordered pills with category tags
6. **Meta row** — course count, group count, and "Browse →" accent-colored link

Each card receives CSS custom properties `--accent` and `--accent-rgb` from its subteam's accent token, enabling CSS rules in `home.css` to style hover effects with the correct color.

## Sticky topbar (`src/components/home/HomeHeader.tsx`)

The topbar is sticky at `top: 0` with `backdrop-filter: blur(10px)` and a semi-transparent background. It contains:

1. **BrandLogo** — links to home
2. **Subteam navigation** — links to `/subteams/<id>`, active state via `data-active` attribute, accent-colored when active
3. **Search** — `CourseSearch` component
4. **LanguageSwitcher** — segmented toggle
5. **ThemeToggle** — sun/moon icon button

The subteam nav links receive accent styling via inline CSS custom properties:
```tsx
style={{
  '--accent': `var(${subteam.accent})`,
  '--accent-rgb': `var(${subteam.accentRgb})`,
}}
```

## CSS rules (`src/components/home/home.css`)

| Selector | Property | Description |
|----------|----------|-------------|
| `.hm-topbar` | `sticky`, `backdrop-filter` | Sticky topbar with blur |
| `.hm-catgrid` | `grid-template-columns: repeat(3, 1fr)` | 3-column grid |
| `.hm-cat-card` | `border-top: 2px solid var(--accent)` | Accent-colored top border |
| `.hm-cat-card:hover` | `transform: translateY(-3px)`, `box-shadow` | Hover lift effect |
| `.hm-course-card[data-available='true']` | `cursor: pointer` | Clickable cards |
| `@media (max-width: 860px)` | Grid → 2 columns | Tablet breakpoint |
| `@media (max-width: 620px)` | Grid → 1 column | Mobile breakpoint |

## Top-level data

| Export | Source | Purpose |
|--------|--------|---------|
| `SUBTEAMS` | `src/content/catalog.ts` → `discovery.ts` | All categories with resolved icons |
| `TOTAL_COURSES` | `discovery.ts` | Count of all discovered courses |
| `TOTAL_SUBTEAMS` | `discovery.ts` | Count of categories (always 3) |
| `courseCountForSubteam()` | `discovery.ts` | Per-category course count |

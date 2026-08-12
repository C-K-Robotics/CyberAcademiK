---
type: subteam-page
title: Subteam Page
description: The category detail page showing a subteam's header, subcategory groups, and per-course cards with level, duration, and availability.
tags: [subteam, category-detail, subteam-page, course-listing]
---

# Subteam Page

The subteam page (`/subteams/:id`) shows a detailed view of a single category (subteam), listing its subcategories and all courses within them.

## Component tree

```
SubteamPage (SubteamPage.tsx)
├── HomeHeader (shared topbar)
├── CategoryDetail (main content)
│   ├── Breadcrumb ("Library / <subteam title>")
│   ├── Header (icon, title, blurb)
│   └── 2-column subcategory grid
│       └── Each subcategory group
│           └── Course cards (one per course)
└── Footer
```

## SubteamPage (`src/components/home/SubteamPage.tsx`)

```tsx
export function SubteamPage() {
  const { id } = useParams<{ id: string }>()
  const subteam = id ? getSubteam(id) : undefined
  if (!subteam) return <NotFound />

  return (
    <div className="app-grid" ...>
      <HomeHeader />
      <div style={{ flex: 1 }}>
        <CategoryDetail subteam={subteam} />
      </div>
      <Footer />
    </div>
  )
}
```

The route parameter `id` is looked up via `getSubteam(id)` (from `src/content/selectors.ts`). If no matching subteam exists, it renders the `NotFound` page.

## CategoryDetail (`src/components/home/CategoryDetail.tsx`)

### Breadcrumb
A simple breadcrumb trail: `Library / <subteam title>` with a link back to home.

### Header
Displays the subteam's icon (Lucide component rendered at 58×58 rounded square), localized title, and blurb text.

### Subcategory grid
A 2-column grid (`.hm-subgrid` from `home.css`) where each column is a subcategory group. Each group shows:
- **Group name** with "NOW" badge if the current course is in this group
- **Course cards** — one per course in the group

### Course card

Each course card shows:
- **Numbered index** (padded two-digit)
- **Localized title** with "NEW" badge if `course.isNew`
- **Description** in the active locale
- **Metadata row**: level label (translated), duration (localized with `formatMinutes()`), and "Coming soon" if the course has no MDX content yet

The `data-available` attribute distinguishes available courses from "coming soon" ones, enabling CSS to style them differently (pointer cursor for available, default for coming soon).

```tsx
if (available) {
  return <Link to={`/courses/${course.slug}`} className="hm-course-card" data-available="true">...</Link>
}
return <div className="hm-course-card" data-available="false" aria-disabled="true">...</div>
```

## Layout CSS

The subteam page uses `hm-cat-wrap` for max-width (1080px) and padding, plus the same accent-based theming as the home page cards.

## Data sources

| Data | Source |
|------|--------|
| `subteam` (current page) | `getSubteam(id)` from `src/content/selectors.ts` |
| `groups` and `courses` | Derived from `subteam.groups[].courses` |
| `available` check | `isCourseAvailable(course)` from `selectors.ts` |
| Translations | `useI18n()` → `t.levelBeginner`, `t.comingSoon`, etc. |

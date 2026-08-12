---
type: search-component
title: Course Search
description: Live catalog search component with keyboard navigation, result scoring, and dual topbar variants.
tags: [search, course-search, autocomplete, keyboard-navigation]
---

# Course Search

The course search provides live search across both courses and subteams (categories) with keyboard navigation, result scoring, and click-to-open navigation. It appears in both the home topbar and course topbar.

## Component tree

```
CourseSearch (CourseSearch.tsx)
├── Search icon (Lucide)
├── Input (text, combobox role)
└── Panel (dropdown)
    ├── No results message
    └── Result items
        ├── Course hit: title, subteam, level, duration, NEW badge
        └── Subteam hit: title, blurb, "Subteam" tag
```

## SearchCatalog (`src/content/selectors.ts` → `src/content/discovery.ts`)

The search function `searchCatalog(rawQuery, locale)` implements a weighted scoring algorithm:

### Scoring

Each token in the query must match somewhere in the candidate's text (AND logic). Then:

**Course hits:**
- Base score: 2 (so courses outrank subteams at equal relevance)
- Title prefix match: +100
- Title substring match: +50
- Subteam title match in haystack: +15
- Subcategory name match in haystack: +15

**Subteam hits:**
- Base score: 1
- Title prefix match: +80
- Title substring match: +40

Results are sorted descending by score, capped at `MAX_SEARCH_HITS` (8).

### Token matching

```ts
const tokens = q.split(/\s+/).filter(Boolean)
// Every token must appear in the haystack
if (tokens.every((tok) => subteamHay.includes(tok))) { ... }
```

## Component state

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `query` | string | `""` | Search text |
| `open` | boolean | `false` | Whether the panel is open |
| `active` | number | `0` | Keyboard-highlighted result index |
| `results` | SearchHit[] | computed | Filtered + scored results |

## Keyboard navigation

| Key | Action |
|-----|--------|
| `↑` | Move highlight up |
| `↓` | Move highlight down, open panel if closed |
| `↵` | Navigate to highlighted result |
| `esc` | Clear query or close panel |
| Focus | Open panel |

## Result rendering

### Course hit

```tsx
<span className="ca-item-title">{hit.title}</span>
<span className="ca-item-ctx">{hit.subteamTitle}</span>
<span>{levelLabel(hit.level, t)}</span>
<span>◷ {formatMinutes(hit.minutes, locale)}</span>
{hit.isNew && <span className="ca-tag ca-tag--new">NEW</span>}
```

### Subteam hit

```tsx
<span className="ca-item-title">{hit.title}</span>
<span className="ca-tag">Subteam</span>
<span>{hit.blurb}</span>
<span>{courseCount} courses</span>
```

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `"home"` / `"course"` | `"home"` | Controls typography and sizing |
| `locale` | Locale | from `useI18n()` | Search language |

## CSS rules (`src/components/search/CourseSearch.css`)

Key selectors:
- `.ca-search` — base search container with icon + input
- `.ca-search--home` vs `.ca-search--course` — variant-specific styling
- `.ca-panel` — dropdown panel with box-shadow and backdrop
- `.ca-item[data-active]` — highlighted row with accent background
- `.ca-tag` — small label pill ("Subteam" / "NEW")
- `.ca-empty` — "No results" message

## Re-rendering

The results are memoized: `useMemo(() => searchCatalog(query, locale), [query, locale])`. The highlight index resets whenever query or locale changes. The active item is auto-scrolled into view via `scrollIntoView({ block: 'nearest' })`.

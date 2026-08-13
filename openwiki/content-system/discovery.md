---
type: content-discovery
title: Content Discovery System
description: How CyberAcademiK transforms raw catalog data from the Vite plugin into renderable CourseModules, with lazy MDX loading and automatic bundle matching.
tags: [discovery, catalog, lazy-loading, course-modules, search]
---

# Content Discovery System

The content discovery layer lives in `src/content/discovery.ts`. It transforms the raw catalog from the Vite plugin (`virtual:course-catalog`) into the types used by UI components, sets up lazy MDX loaders, matches course bundles, and provides catalog query utilities.

## Data flow

```
CATALOG (virtual:course-catalog)
  ↓  categories.map(...)
SUBTEAMS[] with resolved LucideIcon components + Localized<string>
  ↓  build metadata maps
RAW_BY_SLUG map (for fast course lookup by slug)
  ↓  import.meta.glob imports
CONTENT_LOADERS + BUNDLE_BY_SLUG maps
  ↓  exposed functions
getCourseModule(), findCourseEntry(), searchCatalog(), getLessonPosition()
```

## Key exports

### `SUBTEAMS` (const)

The fully resolved `Subteam[]` array with:
- Lucide icons resolved from string names via `resolveIcon()` (see `src/content/icons.ts`)
- `accentRgb` computed as `${accent}-rgb` string
- Localized fields filled with fallback from default locale via `fill()` helper
- `CourseEntry` objects with derived metadata

```ts
export const SUBTEAMS: Subteam[] = categories.map((cat) => ({
  id: cat.id,
  icon: resolveIcon(cat.icon),
  accent: cat.accent,
  accentRgb: `${cat.accent}-rgb`,
  title: fill(cat.title, cat.id),
  blurb: fill(cat.blurb, ''),
  tags: fill(cat.tags, []),
  groups: cat.groups.map((group) => ({
    id: group.id,
    name: fill(group.name, group.id),
    courses: group.courses.map(toCourseEntry),
  })),
}))
```

### `fill<T>()` helper

Expands a per-locale map to a full `Localized<T>`, filling gaps from the default locale. This ensures that if a course only defines `en` frontmatter, the `zh-Hant` values still resolve (to the English fallback).

```ts
function fill<T>(byLocale: Record<string, T>, fallback: T): Localized<T> {
  const def = byLocale[DEFAULT_LOCALE] ?? Object.values(byLocale)[0] ?? fallback
  const out = {} as Localized<T>
  for (const locale of LOCALES) out[locale] = byLocale[locale] ?? def
  return out
}
```

### `getCourseModule(slug)` → `CourseModule | undefined`

The primary function for resolving a renderable course by slug. For each locale in the course's `locales` array, it looks up the corresponding `CONTENT_LOADER` from the Vite glob and stores it in `content[locale]`. Merges the course's optional `CourseBundle` components.

```ts
export function getCourseModule(slug: string): CourseModule | undefined {
  const raw = RAW_BY_SLUG[slug]
  if (!raw) return undefined
  const bundle = BUNDLE_BY_SLUG[slug]
  const content: CourseModule['content'] = {}
  for (const locale of raw.locales) {
    const loader = CONTENT_LOADERS[raw.contentPaths[locale]]
    if (loader) content[locale as Locale] = loader
  }
  return {
    meta: buildMeta(raw),
    components: bundle?.components ?? {},
    Wrapper: bundle?.Wrapper,
    content,
  }
}
```

### `CONTENT_LOADERS` — lazy MDX glob

```ts
const CONTENT_LOADERS = import.meta.glob('/content/**/*.mdx') as Record<string, ContentLoader>
```

All MDX files under `content/` are imported as lazy (code-split) Webpack/Vite dynamic imports. Each loader is a function `() => Promise<{ default: ComponentType }>`.

### `BUNDLE_BY_SLUG` — eager bundle mapping

```ts
const COURSE_BUNDLES = import.meta.glob('/src/courses/*/index.tsx', {
  eager: true,
  import: 'default',
}) as Record<string, CourseBundle>
```

Course bundles are imported eagerly (not lazily), then parsed by extracting the slug from the path using `/src/courses/([^/]+)\/index\.tsx$/` regex.

## Query functions

### `findCourseEntry(slug)` → `{ subteam, course } | undefined`

Finds a course in the catalog and returns its owning subteam. Used for breadcrumbs and navigation context.

### `getLessonPosition(slug)` → `{ number, total } | undefined`

Computes a course's 1-based position within its subcategory module (e.g. "LESSON 03 / 05"). Derived from `group.courses` array order — never authored in code.

### `searchCatalog(rawQuery, locale)` → `SearchHit[]`

In-memory full-text search over the catalog. Every whitespace-separated token must appear in the candidate text. Results are scored and ranked:
- Course outranks subteam at equal relevance (+2 base score)
- Prefix title match scores +100, substring match +50
- Parent subteam/subcategory match adds +15
- Capped at `MAX_SEARCH_HITS` (8)

### `SearchHit` types

```ts
type SearchHit = CourseHit | SubteamHit

interface CourseHit {
  kind: 'course'
  slug: string; title: string; desc: string
  groupName: string; subteamId: string; subteamTitle: string
  accent: string; accentRgb: string
  level: Level; minutes: number; isNew?: boolean
}

interface SubteamHit {
  kind: 'subteam'
  id: string; title: string; blurb: string
  accent: string; accentRgb: string; courseCount: number
}
```

## Selector re-exports

| Module | Exports |
|--------|---------|
| `src/content/catalog.ts` | `SUBTEAMS` |
| `src/content/selectors.ts` | `TOTAL_COURSES`, `TOTAL_SUBTEAMS`, `courseCountForSubteam()`, `getSubteam()`, `isCourseAvailable()`, `findCourseEntry()`, `getLessonPosition()`, `searchCatalog()` + `SearchHit` types |
| `src/content/registry.ts` | `getCourseModule` |

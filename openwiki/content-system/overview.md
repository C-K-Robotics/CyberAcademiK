---
type: content-overview
title: Content System Overview
description: How CyberAcademiK's content discovery system works — from on-disk MDX files to typed, renderable course modules with no code registration required.
tags: [content, discovery, autodiscovery, mdx, catalog]
---

# Content System Overview

CyberAcademiK has **no server, no database, and no registration system**. Every course, category, subcategory, and piece of metadata is derived from the `content/` directory at build time. The directory layout *is* the taxonomy.

## Three-level content hierarchy

The `content/` directory uses a three-level folder structure:

```
content/
├── <category>/                           ← Subteam (e.g. "mechanical-design")
│   ├── _category.json                    ← Category metadata (id, title, accent, tags)
│   ├── <subcategory>/                    ← CourseGroup (e.g. "mechanisms")
│   │   ├── _subcategory.json             ← Subcategory metadata (id, name, order)
│   │   └── <course-slug>/                ← Course (folder name = URL slug)
│   │       ├── en.mdx                    ← English lesson content
│   │       └── zh-Hant.mdx               ← Traditional Chinese lesson content
│   └── …
```

Every content item is a directory at three levels. The **folder name at the deepest level is the course slug** — it becomes the URL path (`/courses/<slug>`) and is used to match optional course bundles.

## Three subteams (top-level categories)

| Category | ID | Icon | Accent | Disciplines |
|----------|----|------|--------|-------------|
| Mechanical & Design | `mech` | `Hexagon` | `--ac2` (purple) | CAD, mechanisms, manufacturing |
| Electrical Engineering | `elec` | `Zap` | `--ac6` (amber) | Circuits, wiring, power |
| Control × Programming | `ctrl` | `RefreshCw` | `--ac1` (teal) | Java, control theory, perception |

Each subteam's metadata lives in `content/<category>/_category.json`, a JSON file with localized title, blurb, tags, an accent color reference, and a Lucide icon name.

## Metadata locations

| What | Where | Notes |
|------|-------|-------|
| Category metadata (title, blurb, accent, icon, tags) | `content/<category>/_category.json` | Localized, one file per category |
| Subcategory metadata (id, name, order) | `content/<category>/<subcategory>/_subcategory.json` | Localized, one file per subcategory |
| Course metadata (title, lead, author, level, minutes, etc.) | YAML frontmatter at top of each `<slug>/<locale>.mdx` | Per-locale, fields can differ slightly between locales |
| Course content (lessons, sections, MDX components) | Body of `<slug>/<locale>.mdx` after frontmatter | |

## Auto-discovery guarantees

- **Counts are derived.** `TOTAL_COURSES`, `TOTAL_SUBTEAMS`, and per-subteam counts are all computed from the discovered catalog — the UI always matches what exists on disk.
- **Sidebar is derived.** The lesson sidebar lists the current subteam's subcategories and their real courses. It cannot drift from `content/` because it reads the same `SUBTEAMS` array.
- **Adding a course is a file operation.** Drop an MDX file into the right directory, and it appears in the catalog. No code changes, no registration, no config updates.

## Extension: course bundles

Pure-content courses need **zero code** — they just use the generic MDX components. If a course needs interactive widgets (custom React components injected into its MDX), it adds a `src/courses/<slug>/index.tsx` whose default export is a `CourseBundle`:

```tsx
// src/courses/pid-control/index.tsx
export default {
  components: { PIDSimulator, BlockDiagram, ZieglerNichols, ... },
  Wrapper: PidGainsProvider,  // optional shared state provider
}
```

The folder name (`pid-control`) must match the course directory name under `content/`. The bundle is auto-discovered via Vite's `import.meta.glob` (see [Course Bundles](../content-system/course-bundles.md) for details).

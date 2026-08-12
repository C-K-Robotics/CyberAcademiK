---
type: architecture-overview
title: System Overview
description: High-level architecture of CyberAcademiK — a static React SPA for FRC robotics education with auto-discovered MDX content, deployed to GitHub Pages.
tags: [architecture, overview, static-site, react]
---

# System Overview

CyberAcademiK is a **static React single-page application** (SPA) built with Vite and TypeScript, designed as an interactive learning library for FRC (FIRST® Robotics Competition) robotics. It covers three disciplines — mechanical design, electrical engineering, and control × programming — using MDX content authored in markdown with embedded React components.

## Key architectural principles

- **No backend.** Every piece of content, course count, subteam listing, and navigation structure is derived at build time from the on-disk `content/` directory. Adding content is a file operation — no registration, configuration, or code changes required.
- **Content-driven taxonomy.** The `content/` directory tree is the system of record. A three-level hierarchy (`category` → `subcategory` → `course`) maps to `Subteam` → `CourseGroup` → `CourseEntry` in the typed data model. JSON sidecars (`_category.json`, `_subcategory.json`) provide localized metadata.
- **Virtual module pipeline.** A custom Vite plugin (`vite/course-content.ts`) walks `content/` at build time, parses YAML frontmatter, and generates a `virtual:course-catalog` module that the rest of the app imports. This decouples content structure from application code.
- **Course bundles for interactivity.** Pure-content courses need zero code. Courses that need interactive widgets (currently only `pid-control`) provide a `src/courses/<slug>/index.tsx` exporting a `CourseBundle` — the folder name is auto-matched to the course slug.
- **Client-side routing under a sub-path.** React Router serves a SPA under `/CyberAcademiK/` (GitHub Pages project site), with `404.html` mirrored from `index.html` for deep-link fallback.

## Runtime entrypoints

```
main.tsx → ThemeProvider → I18nProvider → App → BrowserRouter → Routes
  ├─ /                        → Home (Hero + category grid)
  ├─ /subteams/:id            → SubteamPage (category detail)
  ├─ /courses/:slug           → CoursePage (lesson reader)
  └─ *                        → NotFound
```

## Content pipeline

```
content/  (MDX files + JSON sidecars)
  ↓  vite/course-content.ts (Vite plugin)
virtual:course-catalog (CATALOG object)
  ↓  src/content/discovery.ts (transforms + lazy loaders + bundle registry)
Subteam[] + CourseModule[] (renderable catalog)
  ↓  Route components (Home, SubteamPage, CourseLayout)
  └─ MDXProvider(merged components) + lazy MDX content
```

## Directory structure (key paths)

| Path | Purpose |
|------|---------|
| `src/main.tsx` | Application entrypoint, provider hierarchy |
| `src/App.tsx` | Route definitions |
| `vite/course-content.ts` | Custom Vite plugin (build-time content scan) |
| `src/content/discovery.ts` | Catalog transformation & lazy loading |
| `src/content/types.ts` | Type definitions for the catalog |
| `src/content/icons.ts` | Lucide icon-to-string mapping |
| `src/mdx/*.tsx` | Generic MDX components for lesson content |
| `src/courses/pid-control/` | Course-specific bundle for PID Control |
| `src/components/` | UI components (routes, layout, search) |
| `src/theme/` | Theme provider + palette |
| `src/i18n/` | Internationalisation (EN + zh-Hant) |
| `content/` | Course content (auto-discovered) |
| `public/` | Static assets (images, favicon) |
| `src/styles/theme.css` | Global CSS custom property tokens |

## Data flow summary

1. **Build time:** `vite/course-content.ts` scans `content/`, reads sidecar JSON and MDX frontmatter, generates `virtual:course-catalog`.
2. **Module resolution:** `src/content/discovery.ts` imports the virtual module, maps course slugs to optional `CourseBundle` entries (from `src/courses/*/index.tsx`), and creates lazy MDX loaders from `content/**/*.mdx`.
3. **Runtime:** Route components call `getCourseModule(slug)` to get a fully resolved `CourseModule`, then render it inside an `MDXProvider` with merged generic + course-specific components.

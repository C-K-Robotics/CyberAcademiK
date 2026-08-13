---
type: wiki-skeleton
title: CyberAcademiK Wiki Skeleton
description: Structured plan for the CyberAcademiK documentation, listing every planned page with its scope.
---

# CyberAcademiK — Wiki Skeleton

## Overview
CyberAcademiK is a static React + TypeScript site (Vite) for interactive FRC robotics education, authored by FRC#8020. Content is MDX auto-discovered from the `content/` directory — no server or registration required. Deployed to GitHub Pages.

---

## 1. /openwiki/quickstart.md
High-level introduction, navigation map, task-routing table from intent to source + tests.

---

## 2. Architecture

### /openwiki/architecture/overview.md
- Single-page application (SPA) using React Router client-side routing under a GitHub Pages sub-path (`/CyberAcademiK/`)
- No backend — all content and counts derived from `content/` at build time
- Vite build pipeline: custom `courseContent()` plugin → MDX compiler → React plugin
- Static output to `dist/`

### /openwiki/architecture/build-pipeline.md
- `vite.config.ts` — base path, plugins, MDX setup (`@mdx-js/rollup`, `remark-gfm`, `rehype-slug`)
- `vite/course-content.ts` — custom Vite plugin: scans `content/` for categories, subcategories, courses; generates `virtual:course-catalog` module with `CATALOG` object; strips YAML frontmatter from MDX
- TypeScript config: `tsconfig.json` (root references) → `tsconfig.app.json` (ES2021, strict, JSX react-jsx for React app) → `tsconfig.node.json` (Node-side Vite plugin code). `tsconfig.node.json` compiles the Vite plugin (`vite/course-content.ts`) independently, as it uses Node `fs` APIs and the Vite `Plugin` type, separate from the app-side React/MDX code.
- Build command: `tsc -b && vite build` (composite build)
- MDX compiler: `providerImportSource: '@mdx-js/react'` — essential for the MDX compiler to import `MDXProvider` from `@mdx-js/react`, enabling `CourseLayout` to wrap lazy MDX with its merged component set at render time.
- GitHub Pages sub-path: `base = process.env.VITE_BASE ?? '/CyberAcademiK/'` — derived from repo name so renames work automatically.

### /openwiki/architecture/routing.md
- `App.tsx` — `BrowserRouter` with `basename` from `BASE_URL`
- Four routes: `/` (Home), `/subteams/:id` (SubteamPage), `/courses/:slug` (CoursePage), `*` (NotFound)
- `index.html` → `404.html` copy in CI for SPA deep-link fallback

---

## 3. Content System

### /openwiki/content-system/overview.md
- Data model: `Subteam` (category) → `CourseGroup` (subcategory) → `CourseEntry` (lesson)
- Three domains (subteams): Mechanical & Design, Electrical Engineering, Control × Programming
- Auto-discovery: directory layout is the taxonomy; `content/<category>/<subcategory>/<slug>/<locale>.mdx`
- Content managers add courses by placing `.mdx` files + optional `_category.json` / `_subcategory.json` sidecars

### /openwiki/content-system/types-and-schema.md
- `src/content/types.ts`: `CourseEntry`, `CourseGroup`, `Subteam`, `CourseMeta`, `CourseBundle`, `CourseModule`, `Localized<T>`, `Level`, `Reference`, `UpNext`
- `src/content/raw.ts`: `RawCourse`, `RawSubcategory`, `RawCategory`, `RawCatalog` — Vite plugin output shapes
- Frontmatter schema: title, desc, kicker, lead, author, minutes, level, order, references, upNext, updated, isNew

### /openwiki/content-system/discovery.md
- `vite/course-content.ts` — build-time scan, JSON generation, `virtual:course-catalog`
- `src/content/discovery.ts` — transforms `RawCatalog` → `Subteam[]`, lazy MDX loaders, `BUNDLE_BY_SLUG` mapping, `getCourseModule()`, `findCourseEntry()`, `getLessonPosition()`, `searchCatalog()`
- `src/content/catalog.ts` — re-exports `SUBTEAMS`
- `src/content/selectors.ts` — re-exports `TOTAL_COURSES`, `TOTAL_SUBTEAMS`, `courseCountForSubteam`, `getSubteam`, `isCourseAvailable`, etc.
- `src/content/registry.ts` — re-exports `getCourseModule`
- `src/content/icons.ts` — Lucide icon registry, `resolveIcon()`

### /openwiki/content-system/course-content-plugin.md
- `vite/course-content.ts` deep dive: how it walks the `content/` directory, reads `_category.json`, `_subcategory.json`, parses MDX frontmatter with `js-yaml`, and generates the `virtual:course-catalog` module

### /openwiki/content-system/assets.md
- `public/` directory structure: `favicon.png` (referenced in `index.html`), `intro-to-robotics/` (course images)
- `src/lib/assetUrl.ts` — resolves root-relative paths (`/intro-to-robotics/ur5.png`) against the app's base URL (`/CyberAcademiK/`), passes through absolute URLs (`https://`, `data:`, `//`) untouched
- Conventions: MDX content references `public/` files with root-relative paths; `assetUrl()` is called in `Figure` component and prose `img` override

### /openwiki/content-system/authoring.md
- Captures `content/CLAUDE.md` authoring guide: content tree structure, frontmatter field reference table, `_category.json` / `_subcategory.json` sidecar format
- MDX component vocabulary for lesson authors: `Section`, `Slide`, `Callout`, `CodeTabs`/`CodeTab`, `Quiz`/`Q`/`Choice`, `Figure`, generic prose
- Course-with-widgets workflow: creating `src/courses/<slug>/index.tsx` with `CourseBundle` export

### /openwiki/content-system/course-bundles.md
- Optional `src/courses/<slug>/index.tsx` pattern: default export is `CourseBundle { components, Wrapper? }`
- Auto-discovered via `import.meta.glob('/src/courses/*/index.tsx', { eager: true })`
- Currently: only `pid-control` has a bundle

---

## 4. UI — Application Shell

### /openwiki/ui/overview.md
- Entry point: `src/main.tsx` — React 18 root, `StrictMode`, provider hierarchy: `ThemeProvider` → `I18nProvider` → `App`
- Theme system: `src/theme/ThemeProvider.tsx` (light/dark, localStorage, system pref)
- CSS architecture: `src/styles/theme.css` (CSS custom properties, light/dark tokens, 6 accent colors)
- Canvas palette: `src/theme/palette.ts` (theme-mirrored colors for canvas 2D rendering)

### /openwiki/ui/providers.md
- `src/theme/ThemeProvider.tsx` — context, read/write localStorage, `useTheme()` hook
- `src/i18n/I18nProvider.tsx` — context, locale detection (localStorage + navigator), `useI18n()` hook
- `src/i18n/strings.ts` — `Strings` interface, English + Traditional Chinese literal strings
- `src/i18n/format.ts` — `formatMinutes()`, `pad2()`

---

## 5. UI — Routes

### /openwiki/ui/routes/home.md
- `src/components/home/Home.tsx` — app-grid, Hero, 3-column CategoryCard grid
- `src/components/home/HomeHeader.tsx` — sticky topbar, subteam nav links, search, language, theme
- `src/components/home/Hero.tsx` — headline, lead text, meta count
- `src/components/home/CategoryCard.tsx` — icon, title, blurb, tags, course/group count, accent styling
- `src/components/home/home.css` — 3-column grid (`repeat(3, 1fr)`), card hover/transition effects (`transform`, `box-shadow`), course card `data-available` states, responsive breakpoints at 860px and 620px

### /openwiki/ui/routes/subteam-page.md
- `src/components/home/SubteamPage.tsx` — route `/subteams/:id`, lookup subteam, show CategoryDetail or NotFound
- `src/components/home/CategoryDetail.tsx` — breadcrumb, subteam header, 2-column subcategory grid, per-course cards with level, duration, "coming soon" state

### /openwiki/ui/routes/course-page.md
- `src/components/course/CoursePage.tsx` — route `/courses/:slug`, get course module, render CourseLayout
- `src/components/course/CourseLayout.tsx` — MDXProvider with merged components, sidebar toggle, slide mode, lazy MDX code-split per locale, Wrapper provider
- Sidebar behavior: desktop collapses, mobile drawers with overlay

---

## 6. UI — Components

### /openwiki/ui/components/layout.md
- `src/components/layout/BrandLogo.tsx` — Cyberpunk wordmark SVG, theme-aware image swap
- `src/components/layout/Logo.tsx` — inline SVG mark (step response curve) + wordmark
- `src/components/layout/Footer.tsx` — attribution, copyright, discipline tagline
- `src/components/layout/LanguageSwitcher.tsx` — segmented toggle, `useI18n()`, `LOCALES`
- `src/components/layout/ThemeToggle.tsx` — sun/moon icon toggle, `useTheme()`
- `src/components/ScrollToTop.tsx` — scroll-to-top on pathname change

### /openwiki/ui/components/search.md
- `src/components/search/CourseSearch.tsx` — live catalog search, keyboard nav (↑↓↵esc), `searchCatalog()`, result types (CourseHit / SubteamHit)
- `src/components/search/CourseSearch.css` — panel positioning, highlight styles

### /openwiki/ui/components/course-reader.md
- `src/components/course/CourseTopbar.tsx` — sticky header: hamburger, breadcrumb, search, slide toggle, language, theme
- `src/components/course/CourseSidebar.tsx` — subteam → subcategory → lesson tree, derived from catalog, current lesson highlight, collapsible
- `src/components/course/ChipNav.tsx` — auto-discovered section nav, IntersectionObserver, MutationObserver for locale swaps
- `src/components/course/SlideDeck.tsx` — slide mode, DOM-based step discovery, `data-slide` markers, localStorage position, keyboard prev/next
- `src/components/course/LessonHeader.tsx` — eyebrow (kicker + lesson counter), title, lead, author, duration, level, updated
- `src/components/course/CourseFooterNav.tsx` — "up next" card + references list
- `src/components/course/course.css` — sidebar collapse/drawer, chip nav, responsive

### /openwiki/ui/components/not-found.md
- `src/components/NotFound.tsx` — 404 page, logo, back-to-library link

---

## 7. MDX Components

### /openwiki/mdx/overview.md
- Generic MDX components available in every course: `prose.tsx` → `components.tsx` → specific components
- Merged at render time in `CourseLayout` with `CourseBundle` components

### /openwiki/mdx/prose-components.md
- `src/mdx/prose.tsx` — styled overrides: `img` (uses `assetUrl`), `p`, `h2`, `h3`, `h4`, `strong`, `pre`, `code`, `blockquote`, `ul`, `ol`, `table`, etc.

### /openwiki/mdx/blocks.md
- `src/mdx/Section.tsx` — numbered section with `data-section`, `data-n`, `data-chip` attributes (auto-discovered by ChipNav)
- `src/mdx/Slide.tsx` — slide break marker with `data-slide` attribute (discovered by SlideDeck)
- `src/mdx/Callout.tsx` — info/tip/warn aside boxes with icons (Info, Lightbulb, TriangleAlert)
- `src/mdx/CodeTabs.tsx` — tabbed code viewer with copy button, uses `navigator.clipboard`
- `src/mdx/Figure.tsx` — captioned image with `assetUrl` resolution for public/ assets
- `src/mdx/mdx.css` — component-specific overrides: `.codetabs-body pre` (drops pre box inside tabs), `.lesson-prose a` (accent underline hover), `.lesson-section` scroll-margin (slide-mode aware), `.quiz-markdown` inline styles for strong/em/code

### /openwiki/mdx/quiz.md
- `src/mdx/Quiz.tsx` — declarative MCQ: `<Quiz>` → `<Q>` → `<Prompt>`, `<Explain>`, `<Choice correct>`
- Renders interactive scored questions, inline markdown parsing
- `src/mdx/ProseContent.tsx` — `InlineMarkdownText` for bold/italic/inline-code in non-MDX strings

---

## 8. PID Course (Course Bundle)

### /openwiki/pid-course/overview.md
- `src/courses/pid-control/index.tsx` — `CourseBundle` auto-discovered by slug
- Provides `PidGainsProvider` wrapper and 6 course-specific MDX components
- Only course with custom interactive widgets

### /openwiki/pid-course/pid-gains-context.md
- `src/courses/pid-control/PidGains.tsx` — shared PID gains context (`kp`, `ki`, `kd`)
- `setGains()` allows Ziegler-Nichols calculator to push gains into live simulator
- `scrollToSimulator()` helper for smooth scroll to simulator section

### /openwiki/pid-course/simulators.md
- `src/courses/pid-control/components/PIDSimulator.tsx` — HiDPI canvas, `useRafLoop` animation, 3rd-order mass-spring-damper plant simulation
  - Plant models: sluggish, balanced, springy
  - Computes overshoot, settling time, steady-state error, rise time
- `src/courses/pid-control/components/ArmSimulator.tsx` — 2DOF arm model (angle, velocity, gravity, feedforward), 3 canvases (arm angle, graph, gauge)
- `src/courses/pid-control/components/BlockDiagram.tsx` — SVG block diagram of PID loop
- `src/courses/pid-control/components/PlantSchematic.tsx` — SVG mass-spring-damper schematic
- `src/courses/pid-control/components/ThreeTerms.tsx` — rendered PID equation display
- `src/courses/pid-control/components/ZieglerNichols.tsx` — interactive Z-N calculator with table of rules, applies gains to shared context

### /openwiki/pid-course/libraries.md
- `src/lib/canvas.ts` — `setupHiDPICanvas()`, `clamp()`
- `src/lib/useRafLoop.ts` — `useRafLoop(dt, ts)` per-frame hook with delta clamping, `useOnResize()` debounced resize
- `src/lib/assetUrl.ts` — base-path resolution for public assets

---

## 9. Internationalisation

### /openwiki/i18n/overview.md
- `src/i18n/strings.ts` — `Strings` interface with all UI labels (70+ strings)
- Two locales: `en` (English), `zh-Hant` (Traditional Chinese)
- `LOCALES` array, `DEFAULT_LOCALE`, `LOCALE_LABELS`, `LOCALE_NAMES`
- `src/i18n/I18nProvider.tsx` — locale context, `localStorage` persistence, browser-language detection
- Course content uses per-locale MDX files: `en.mdx` / `zh-Hant.mdx`

---

## 10. Styles

### /openwiki/styles/themes.md
- `src/styles/theme.css` — CSS custom property design tokens
- Light theme defaults: warm blue-gray palette
- Dark theme: `[data-theme='dark']` overrides
- 6 accent colors: `--ac1` (teal) through `--ac6` (amber)
- Typography: IBM Plex Sans / IBM Plex Mono, 10px-52px scale
- Scrollbar styling, range input styling, selection

---

## 11. Operations

### /openwiki/operations/deployment.md
- `.github/workflows/deploy.yml` — GitHub Pages deployment on push to `main`
- Node 20, yarn install, `tsc -b && vite build`
- `cp dist/index.html dist/404.html` for SPA deep-link fallback
- `actions/deploy-pages@v4` publish
- `VITE_BASE` env var for repository name

### /openwiki/operations/docker.md
- `Dockerfile` — Node 20 Alpine, yarn install, exposes 5173
- `docker-compose.yml` — dev environment with volume mount, hot-reload via CHOKIDAR_USEPOLLING
- Dev URL: `http://localhost:5173/CyberAcademiK/`

### /openwiki/operations/openwiki-update.md
- `.github/workflows/openwiki-update.yml` — scheduled (daily 8 AM UTC) and manual wiki update workflow
- Uses OpenWiki CLI (`openwiki code --update --print`) to scan repository and generate wiki updates
- Configured with OpenRouter API provider and LangSmith tracing
- Creates a pull request with wiki diffs via `peter-evans/create-pull-request`
- No test framework currently configured (no `vitest`, `jest`, or test files)
- Validation: `yarn typecheck` (`tsc -b --noEmit`) and `yarn lint` (same)
- Manual testing via `yarn dev` / `yarn preview`

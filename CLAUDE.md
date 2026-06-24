# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

CyberAcademiK is an interactive FRC robotics learning library — lessons authored in **MDX**, compiled to a static site with **Vite**, deployed to **GitHub Pages**. No backend; everything is computed at build time. Package manager is **Yarn** (classic, v1).

## Commands

```bash
yarn dev          # dev server (served under the /CyberAcademiK/ base — open the URL Vite prints)
yarn build        # tsc -b && vite build → dist/
yarn preview      # serve the production build locally
yarn typecheck    # tsc -b --noEmit
yarn lint         # identical to typecheck — there is NO ESLint/Prettier in this project
```

There is **no test runner** — verification is `yarn build` (it typechecks via `tsc -b`) plus manual checking in the browser. `lint` and `typecheck` are the same command; "linting" rules are TypeScript's strict-mode flags in `tsconfig.app.json` (`noUnusedLocals`, `noUnusedParameters`, etc.).

## The content pipeline (the core architecture)

Courses are **auto-discovered from the `content/` directory at build time — nothing is registered in code.** The directory layout *is* the taxonomy:

```
content/<category>/<sub-category>/<course-slug>/<locale>.mdx
```

- `_category.json` (in each category dir): `id, order, icon, accent, title, blurb, tags` (localized fields are `{ [locale]: value }` maps).
- `_subcategory.json` (in each sub-category dir): `id, order, name`.
- Each `<locale>.mdx` carries **all per-course metadata in its YAML frontmatter** (`title, lead, kicker, author, level, minutes, references, upNext, isNew, order, …`). There is no `meta.ts`/`catalog.ts` data file.

Data flow:

1. **`vite/course-content.ts`** (Vite plugin, `enforce: 'pre'`) scans `content/` at build time, parses frontmatter with `js-yaml`, and exposes it as the **`virtual:course-catalog`** module (`CATALOG.categories`). It also has a `transform` hook that **strips the YAML frontmatter block from MDX** before the MDX compiler sees it (so metadata never renders), and a `configureServer` watcher that re-scans + full-reloads on any `content/` change in dev.
2. **`src/content/discovery.ts`** turns `CATALOG` into the typed `SUBTEAMS`, builds `getCourseModule(slug)`, and wires the renderable pieces via two globs:
   - `import.meta.glob('/content/**/*.mdx')` — lazy, code-split MDX bodies per course+locale.
   - `import.meta.glob('/src/courses/*/index.tsx', { eager: true })` — optional course-specific code, matched to a course **by folder name = slug**.
3. **`catalog.ts`, `registry.ts`, `selectors.ts`** are thin re-export shims over `discovery.ts` (kept for stable import paths). Prefer adding new exports to `discovery.ts`.

**All counts are derived** (`TOTAL_COURSES`, `courseCountForSubteam`, etc.) — never hardcode course/subteam numbers. Empty groups render "Coming soon". Only `control-programming/control-theory/pid-control` has a real lesson; the other category/sub-category dirs are sidecar-only curriculum skeleton.

### Adding content

- **Pure-content course:** drop `content/<cat>/<sub>/<slug>/<locale>.mdx` with frontmatter. It appears in the catalog and counts automatically — no code changes.
- **Course with custom widgets:** also add `src/courses/<slug>/index.tsx` whose **default export is a `CourseBundle`** (`{ components, Wrapper? }`, see `src/content/types.ts`). `components` are merged over the generic MDX set for that course's MDX; `Wrapper` wraps the rendered lesson (e.g. `PidGainsProvider` shares simulator state). See `src/courses/pid-control/` for the reference example.
- **New category / sub-category:** create the directory with a `_category.json` / `_subcategory.json` sidecar (copy the shape of an existing one).

## App structure

- `src/main.tsx` → provider stack: `ThemeProvider` → `I18nProvider` → `App`.
- `src/App.tsx` uses **`BrowserRouter`** with `basename` derived from `import.meta.env.BASE_URL` (Vite's `base`, trailing slash trimmed). Routes: `/` (Home), `/courses/:slug` (CoursePage), `*` (NotFound). Deep-link safety on GitHub Pages comes from the deploy workflow copying `dist/index.html` → `dist/404.html` (SPA fallback for unmatched paths).
- MDX rendering: `CoursePage` → `getCourseModule(slug)` → `CourseLayout` picks the active locale's lazy loader (falling back to `DEFAULT_LOCALE`), renders inside `<MDXProvider components={generic + course}>` + the course `Wrapper`.
- Generic MDX components (available to every course) live in `src/mdx/`: `Section`, `Callout`, `Quiz`/`Q`/`Choice`, `CodeTabs`/`CodeTab`, `Figure`, plus prose element overrides. Registered in `src/mdx/components.tsx`.

## i18n

- Locales: `en` + `zh-Hant` (`src/i18n/strings.ts`, `LOCALES`/`DEFAULT_LOCALE`). Add a locale by extending `LOCALES`, providing the `Strings` object, and adding matching `<locale>.mdx` files.
- **UI chrome strings** are typed in `src/i18n/strings.ts` (functions for pluralized/interpolated text). **Course content** is per-locale MDX — never put lesson text in `strings.ts`.
- Active locale is app state (`I18nProvider`, persisted in `localStorage` under `cyberacademik:locale`), switched in the header. `discovery.ts`'s `fill()` backfills any missing localized field from the default locale.

## Theming & canvas widgets

- Light/dark via CSS custom properties on `:root[data-theme]` (`src/styles/theme.css`). Fonts: IBM Plex Sans + IBM Plex Mono.
- Canvas/SVG widgets (the PID simulators) **can't cheaply read CSS vars**, so colors are mirrored per-theme in `src/theme/palette.ts`. Use `usePalette()` to get theme-matched colors that re-render on theme change — keep these values in sync with `theme.css` accents. RAF animation helper: `src/lib/useRafLoop.ts`; canvas helpers: `src/lib/canvas.ts`.

## Deployment

- Pushing to `main` triggers `.github/workflows/deploy.yml` → `yarn build` → publishes `dist/` to GitHub Pages.
- The site is a **project Pages site served from `/CyberAcademiK/`**. `vite.config.ts` reads `base` from `VITE_BASE` (CI sets it to `/<repo-name>/`, so a repo rename just works) and defaults to `/CyberAcademiK/` locally. Asset URLs and the dev server all run under this base.

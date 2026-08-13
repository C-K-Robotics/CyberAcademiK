# CyberAcademiK — Agent Operating Notes

## Commands

```
yarn dev           # dev server (served under / base)
yarn build         # tsc -b && vite build (strict typecheck + bundle)
yarn preview       # serve dist/ locally
yarn typecheck     # tsc -b --noEmit (also aliased as `yarn lint`)
yarn lint          # identical to typecheck — there is NO ESLint/Prettier in this project
```

**There is no test framework.** `yarn build` (which runs typecheck first) is the full verification pass. Linting and typecheck are the same command — "linting" is strict TypeScript (`noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`) in `tsconfig.app.json`.

**Always commit after making a change** — create a commit (and push when appropriate) once a change is complete and verified, rather than leaving the working tree dirty.

## HMR caveat

The dev server runs inside a **Docker** container with `content/` and `public/` mounted as volumes.

- Editing existing source files (`.tsx`, `.ts`, `.css`) → HMR hot module replacement works instantly.
- Editing content tree files or `_category.json`/`_subcategory.json` → full page reload (vite plugin `configureServer` watcher).
- **Adding new files** (e.g. a new course MDX, a new `.tsx` component, any `public/` asset) → dev server picks them up automatically.
- **Adding new importable modules** (any new `.ts`/`.tsx` files) → the dev server's static `import.meta.glob` cache needs a **container restart** (`docker restart cyberacademik-web-1`) to register new modules. Or use the container shell to create the file and then save an existing file to trigger a reload.

## The content pipeline (the core architecture)

Courses are **auto-discovered from the `content/` directory at build time — nothing is registered in code.** The directory layout *is* the taxonomy:

```
content/<category>/<sub-category>/<course-slug>/<locale>.mdx
```

- `_category.json` (in each category dir): `id, order, icon, accent, title, blurb, tags` (localized fields are `{ [locale]: value }` maps).
- `_subcategory.json` (in each sub-category dir): `id, order, name`.
- Each `<locale>.mdx` carries **all per-course metadata in its YAML frontmatter** (`title, lead, kicker, author, level, minutes, references, upNext, isNew, order, …`). There is no `meta.ts`/`catalog.ts` data file.

Data flow:

1. **`vite/course-content.ts`** (Vite plugin, `enforce: 'pre'`) scans `content/` at build time, parses frontmatter with `js-yaml`, and exposes it as the **`virtual:course-catalog`** module (`CATALOG.categories`). It also has a `transform` hook that **strips the YAML frontmatter block from MDX** before the MDX compiler sees it, and a `configureServer` watcher that re-scans + full-reloads on any `content/` change in dev.
2. **`src/content/discovery.ts`** turns `CATALOG` into the typed `SUBTEAMS`, builds `getCourseModule(slug)`, and wires the renderable pieces via two globs:
   - `import.meta.glob('/content/**/*.mdx')` — lazy, code-split MDX bodies per course+locale.
   - `import.meta.glob('/src/courses/*/index.tsx', { eager: true })` — optional course-specific code, matched to a course by folder name = slug.
3. **`catalog.ts`, `registry.ts`, `selectors.ts`** are thin re-export shims over `discovery.ts` (kept for stable import paths). Prefer adding new exports to `discovery.ts`.

**All counts are derived** (`TOTAL_COURSES`, `courseCountForSubteam`, etc.) — never hardcode course/subteam numbers. Empty groups render "Coming soon". Only `control-programming/foundations/intro-to-robotics` and `control-programming/control-theory/pid-control` have real lessons; the other category/sub-category dirs are sidecar-only curriculum skeleton.

### Adding content

- **Pure-content course:** drop `content/<cat>/<sub>/<slug>/<locale>.mdx` with frontmatter. It appears in the catalog automatically — no code changes.
- **Images:** place them in `public/<slug>/` and reference them root-relative — `<Figure src="/<slug>/image.png" alt="…" caption="…" width="80%" />` or `![alt](/<slug>/image.png)`. Both paths run through `src/lib/assetUrl.ts`, which prefixes the deploy base (`/` in production) and leaves already-complete URLs (`https://…`, `data:…`) alone.
- **Course with custom widgets:** also add `src/courses/<slug>/index.tsx` whose **default export is a `CourseBundle`** (`{ components, Wrapper? }`, see `src/content/types.ts`). `components` are merged over the generic MDX set; `Wrapper` wraps the rendered lesson (e.g. `PidGainsProvider` shares simulator state). See `src/courses/pid-control/` for reference.
- **New category / sub-category:** create the directory with a `_category.json` / `_subcategory.json` sidecar (copy the shape of an existing one).

## App structure

- `src/main.tsx` → provider stack: `ThemeProvider` → `I18nProvider` → `App`.
- `src/App.tsx` uses **`BrowserRouter`** with `basename` derived from `import.meta.env.BASE_URL` (Vite's `base`, trailing slash trimmed). Routes: `/` (Home), `/subteams/:id`, `/courses/:slug`, `*` (NotFound). Deep-link safety on GitHub Pages comes from the deploy workflow copying `dist/index.html` → `dist/404.html` (SPA fallback for unmatched paths).
- MDX rendering: `CoursePage` → `getCourseModule(slug)` → `CourseLayout` picks the active locale's lazy loader (falling back to `DEFAULT_LOCALE`), renders inside `<MDXProvider components={generic + course}>` + the course `Wrapper`.
- Generic MDX components live in `src/mdx/` (registered in `components.tsx`):
  - `Section` — numbered lesson section wrapper. Its spacing is styled by the `.lesson-section` rules in `mdx.css`, which tighten under `.course-main[data-slide-mode]`.
  - `Slide` — an intra-section slide break; invisible in normal scroll mode, a navigation step in slide mode.
  - `Callout` — styled aside blocks (`info`/`tip`/`warn`).
  - `Quiz`/`Q`/`Prompt`/`Explain`/`Choice` — self-assessment quiz. `Q` wraps `<Prompt>`, `<Explain>`, and `<Choice>` children (no prop attributes). All text is rendered through `InlineMarkdownText` to support inline markdown (`**bold**`, `*italic*`, `` `code` ``).
  - `CodeTabs`/`CodeTab` — tabbed code viewer with copy button.
  - `Figure` — captioned image with a configurable `width`; resolves the deploy base via `assetUrl`.
  - Prose element overrides (headings, tables, code, blockquotes etc.) — from `prose.tsx`.
- **Slide mode:** the Monitor toggle in `CourseTopbar` flips `slideMode` state in `CourseLayout`, which hides ChipNav/LessonHeader/FooterNav, marks `.course-main` with `data-slide-mode`, and renders the floating `SlideDeck`. SlideDeck discovers its steps from the rendered DOM — each `<Slide>` inside a `<Section>`, or the whole section when it has none — retrying via rAF until the lazily code-split lesson mounts, and re-scanning on mutation so switching locale mid-deck keeps working. It shows one step at a time with inline `display`, and the effect cleanup restores everything. The position is saved per course slug under `cyberacademik:slide-mode` and clamped to the current step count on load. Keyboard: ←→ ↑↓ PageUp/PageDown, Esc to exit; all ignored while a field has focus.
- Inline markdown in frontmatter: `LessonHeader.tsx` uses `src/mdx/ProseContent.tsx`'s `InlineMarkdownText` component to parse bold/italic/inline-code in the `lead` frontmatter.

## i18n

- Locales: `en` + `zh-Hant` (`src/i18n/strings.ts`, `LOCALES`/`DEFAULT_LOCALE`). Add a locale by extending `LOCALES`, providing the `Strings` object, and adding matching `<locale>.mdx` files.
- **UI chrome strings** are typed in `src/i18n/strings.ts` (functions for pluralized/interpolated text). **Course content** is per-locale MDX — never put lesson text in `strings.ts`.
- Active locale is app state (`I18nProvider`, persisted in `localStorage` under `cyberacademik:locale`), switched in the header. `discovery.ts`'s `fill()` backfills any missing localized field from the default locale.

## Theming & canvas widgets

- Light/dark via CSS custom properties on `:root[data-theme]` (`src/styles/theme.css`). Fonts: IBM Plex Sans + IBM Plex Mono.
- Canvas/SVG widgets (the PID simulators) **can't cheaply read CSS vars**, so colors are mirrored per-theme in `src/theme/palette.ts`. Use `usePalette()` to get theme-matched colors that re-render on theme change — keep these values in sync with `theme.css` accents. RAF animation helper: `src/lib/useRafLoop.ts`; canvas helpers: `src/lib/canvas.ts`.

## Gotchas

- **Never read the DOM during render.** It reflects pre-commit state, and the lesson body doesn't re-render when app state (slide mode, nav collapse) changes — so anything derived that way goes stale rather than merely being late. Drive it from props, from an effect, or from a CSS rule keyed off a data attribute; `Section`'s slide-mode spacing is the CSS version of this.
- **Frontmatter may carry a UTF-8 BOM.** `FRONTMATTER_RE` in `vite/course-content.ts` allows a leading BOM on purpose — Windows editors write them, and without it the block is neither parsed (empty catalog metadata) nor stripped (raw YAML renders as lesson text).
- **Content discovery via `import.meta.glob`** in `src/content/discovery.ts` — not an injected list. Content/MDX files appear automatically (dev server rescans); code modules need a container restart.

## Deployment

- Pushing to `main` triggers `.github/workflows/deploy.yml` → `yarn build` → publishes `dist/` to GitHub Pages.
- The site is a project Pages site with a **custom domain (`docs.ckrobotics.org`), which Pages serves from the domain root** — so `base` is `/`, not `/<repo>/`. The bare `c-k-robotics.github.io/CyberAcademiK/` URL 301-redirects to the custom domain, so a `/<repo>/` base would 404 every asset and blank the page. `vite.config.ts` reads `base` from `VITE_BASE` and defaults to `/`; set `VITE_BASE=/CyberAcademiK/` only if the custom domain is removed.

<!-- OPENWIKI:START -->

## OpenWiki

This repository has a generated `openwiki/` evidence index. It is optional just-in-time context, not required startup reading.

- Treat source code and tests as authoritative. A brief's unknowns and review items are verification gaps, not automatic requirements.
- Prefer the narrowest quiet validation that proves the changed behavior. Preserve complete failure output.

The scheduled OpenWiki GitHub Actions workflow refreshes the repository wiki. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->

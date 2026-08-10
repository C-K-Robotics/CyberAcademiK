# CyberAcademiK — Agent Operating Notes

## Commands

```
yarn dev           # dev server (served under /CyberAcademiK/ base)
yarn build         # tsc -b && vite build (strict typecheck + bundle)
yarn preview       # serve dist/ locally
yarn typecheck     # tsc -b --noEmit  (also aliased as `yarn lint`)
```

**There is no test framework.** `yarn build` (which runs typecheck first) is the
full verification pass. Linting and typecheck are the same command — "linting" is
strict TypeScript (`noUnusedLocals`, `noUnusedParameters`) in `tsconfig.app.json`.

## Content is the database

Courses live under `content/<category>/<subcat>/<slug>/<locale>.mdx`. The directory
lattice *is* the taxonomy — nothing is registered in code. Adding a course is:

1. Drop `<locale>.mdx` with YAML frontmatter in the right folder tree.
2. *(Optional)* Add `src/courses/<slug>/index.tsx` exporting a `CourseBundle`
   (`{ components, Wrapper? }`) for custom widgets. Match by folder name = slug.

Category/subcategory sidecars: `_category.json`, `_subcategory.json` (copy existing
shape).

Course metadata lives in MDX frontmatter only — never in code or `strings.ts`.

## Architecture essentials

- **Build-time pipeline only.** `vite/course-content.ts` (a Vite plugin with
  `enforce: 'pre'`) scans `content/`, parses frontmatter, exposes it via
  `virtual:course-catalog`, and strips the YAML block before MDX compilation.
- `src/content/discovery.ts` consumes the virtual module, globs MDX bodies
  (`import.meta.glob`) and optional course bundles (`import.meta.glob` eager),
  and exports `SUBTEAMS`, `getCourseModule(slug)`, and derived counts. All counts
  are computed — never hardcode numbers.
- **Routes:** `BrowserRouter` with `basename = BASE_URL.replace(/\/$/, '')`.
  Paths: `/` (Home), `/subteams/:id`, `/courses/:slug`, `*` (NotFound).
- **i18n:** Two locales only — `en` and `zh-Hant`. Typed in `src/i18n/strings.ts`
  (the `Strings` interface). Course content is in per-locale `.mdx` files, not in
  code.
- **Theme:** `data-theme` on `:root`, CSS custom properties in `src/styles/theme.css`.
  Canvas/SVG widgets can't read CSS vars — colors must be mirrored in
  `src/theme/palette.ts` via `usePalette()`. Keep in sync with `theme.css` accents.
- **Provider stack:** `ThemeProvider` → `I18nProvider` → `App`, mounted in
  `src/main.tsx` (no `<StrictMode>` at the top-level wrapper — it's inside `<App>`
  in main.tsx).
- **Slide mode (v1):** CourseTopbar has a Monitor icon toggle. `CourseLayout` manages
  `slideMode` state — when active, hides ChipNav/LessonHeader/FooterNav and renders
  a floating SlideDeck at the bottom of the viewport. SlideDeck polls `[data-section]`
  elements via rAF until content mounts, shows only one section at a time, and persists
  the index in localStorage under `cyberacademik:slide-mode` keyed by course slug.
  Keyboard: ←→navigate, Esc exits. CSS hook: `.course-main[data-slide-mode]`.
- **Slide mode navigation:** SlideDeck uses `useMemo` and `useRef` (not `useState`)
  for all slide state: `slidesRef` (the `[data-section]` DOM elements), `slideCount`
  (count of sections, 0 on unmount), `activeIdxRef`, and `activeIdx` (state for
  re-render). The hide/show effect at `SlideDeck.tsx` line 132 uses two guards:
  (1) `slideCount === 0` bail on unmount, and (2) DOM query
  `.course-main[data-slide-mode]` bail when exiting slide mode — these prevent the
  effect from re-hiding sections that cleanup effects (line 113) and `handleExit`
  (line 180) already restored.
- **ChipNav scroll nav:** ChipNav at line 22 uses a `slideMode` prop guard (not DOM
  query) to decide whether to render — this avoids the stale DOM attribute problem
  where React hasn't committed the `data-slide-mode` removal yet during renders.
- **Quiz markdown:** `Q` wraps `<Prompt>`, `<Explain>`, and `<Choice>` children. All
  text is rendered through `InlineMarkdownText` to support inline
  markdown (`**bold**`, `*italic*`, `` `code` ``).

## Gotchas

- **Deploy base path is `/CyberAcademiK/`**. Both dev server and production use it.
  The `.github/workflows/deploy.yml` copies `dist/index.html → dist/404.html` so
  GitHub Pages handles SPA deep links.
- **HMR caveat**: editing existing `.tsx`/`.ts`/`.css`/content files triggers HMR or full reload.
  **Adding new `.ts`/`.tsx` modules** (not content files) needs a **container restart**
  (`docker restart cyberacademik-web-1`) — `import.meta.glob` is statically resolved.
  New content/MDX and `public/` assets appear automatically.
- **TypeScript strict mode** — `noUnusedLocals`, `noUnusedParameters`,
  `noUncheckedSideEffectImports` are all `true`. Unused imports cause build failures.
- **`yarn` v1 (classic)** pinned in `packageManager` field. Use `yarn` not npm/pnpm.
- **Frontmatter regex in `vite/course-content.ts` intentionally has no BOM prefix** (`/^---\r?\n...`).
  A BOM in an MDX file causes `m[1]` to be `undefined` and returns empty frontmatter objects.
- **Content discovery via `import.meta.glob`** in `src/content/discovery.ts` — not an injected list.
  Content/MDX files appear automatically (dev server rescans); code modules need a container restart.
- **React DOM staleness:** querying the DOM during a component's render function (before React
  commits) returns stale results. Always use props or `useMemo`/`useLayoutEffect` instead of
  `document.querySelector` in render to avoid race conditions during transitions. The ChipNav
  `slideMode` prop guard is the correct pattern (vs. the old DOM-query approach).
- **Slide mode exit flow:** SlideDeck's cleanup `useEffect` (line 113) restores all sections on
  unmount, but the hide/show `useEffect` (line 132) can re-hide them if it fires during unmount.
  Two guards prevent this: (1) `slideCountRef.current === 0` (set to 0 in cleanup before effects run),
  (2) `.course-main[data-slide-mode]` DOM attribute check — both bail before any DOM mutation.

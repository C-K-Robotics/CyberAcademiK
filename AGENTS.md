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
- **Slide mode:** CourseTopbar has a Monitor icon toggle. `CourseLayout` owns the
  `slideMode` state — when active it hides ChipNav/LessonHeader/FooterNav, sets
  `data-slide-mode` on `.course-main` (the CSS hook), and renders a floating
  `SlideDeck`. SlideDeck discovers steps from the DOM (every `<Slide>` inside a
  `<Section>`, or the whole section when it has no `<Slide>` breaks), retrying via
  rAF until the lazily code-split lesson body mounts and re-scanning on mutation
  so a locale switch keeps working. Steps are shown/hidden with inline `display`,
  restored by the effect cleanup — so unmounting always leaves the page readable.
  Position persists in localStorage under `cyberacademik:slide-mode`, keyed by
  course slug, and is clamped to the current step count on load.
  Keyboard: ←→ ↑↓ PageUp/PageDown navigate, Esc exits (ignored while typing).
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
- **The frontmatter regex in `vite/course-content.ts` tolerates a leading UTF-8 BOM.**
  Windows editors write them routinely, and without that prefix the frontmatter is
  neither parsed (empty catalog metadata) nor stripped (raw YAML renders as lesson text).
- **Content discovery via `import.meta.glob`** in `src/content/discovery.ts` — not an injected list.
  Content/MDX files appear automatically (dev server rescans); code modules need a container restart.
- **Never read the DOM during render.** It returns pre-commit state, and the lesson body
  does not re-render when app state (slide mode, nav collapse) changes — anything derived
  that way goes stale. Drive it from props, an effect, or a CSS rule keyed off a data
  attribute. `Section`'s slide-mode spacing is the CSS version of this.
- **Images in MDX** — `<Figure src="/slug/x.png">` and `![alt](/slug/x.png)` both point at
  `public/`, and both resolve through `src/lib/assetUrl.ts` so the `/CyberAcademiK/` deploy
  base is prefixed. Absolute (`https://…`) and `data:` URLs pass through untouched.

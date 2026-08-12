---
type: build-pipeline
title: Build Pipeline
description: The Vite build configuration including the custom courseContent() plugin, MDX compilation, and TypeScript composite build.
tags: [build, vite, typescript, mdx, plugin]
---

# Build Pipeline

CyberAcademiK uses Vite 5 with a custom plugin pipeline. The build is a TypeScript composite build (`tsc -b && vite build`) that type-checks before bundling.

## Vite configuration (`vite.config.ts`)

```ts
// Base path: /CyberAcademiK/ for GitHub Pages project site
// Derived from VITE_BASE env var in CI (set to /${repo-name}/)
const base = process.env.VITE_BASE ?? '/CyberAcademiK/'

export default defineConfig({
  base,
  plugins: [
    // 1. Custom plugin: scans content/ → virtual:course-catalog
    courseContent(),
    // 2. MDX compiler: @mdx-js/rollup with remark-gfm, rehype-slug
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',  // ← essential for MDXProvider usage
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      }),
    },
    // 3. React plugin (includes JSX transform)
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
  ],
})
```

### Plugin ordering matters

1. **`courseContent()`** runs first — it reads `content/` files and generates the `virtual:course-catalog` module. It must run before the MDX compiler so it never sees the YAML frontmatter blocks (it strips them).
2. **MDX plugin** (`enforce: 'pre'`) compiles `.mdx` and `.md` files to React components. The `providerImportSource: '@mdx-js/react'` option is essential — it tells the compiler to import `MDXProvider` from the `@mdx-js/react` package rather than generating inline imports, enabling `CourseLayout` to wrap MDX output with its merged component set at render time.
3. **React plugin** handles JSX transformation for all files matching `/(jsx|js|mdx|md|tsx|ts)$/`.

### Plugins configured

| Plugin | Purpose | Options |
|--------|---------|---------|
| `courseContent()` | Custom Vite plugin (see below) | — |
| `@mdx-js/rollup` | Compiles MDX → React components | `providerImportSource: '@mdx-js/react'` |
| `remark-gfm` | GitHub-flavored markdown (tables, strikethrough) | default |
| `rehype-slug` | Adds `id` attributes to headings | default |
| `@vitejs/plugin-react` | JSX transform, HMR for React | `include` glob |

## TypeScript composite build

Three tsconfig files manage the two separate compile targets:

| File | Target | Notes |
|------|--------|-------|
| `tsconfig.json` | Root | Empty `files`, references the two sub-projects |
| `tsconfig.app.json` | React app (`src/`) | ES2021 target, ESNext modules, `react-jsx` JSX, strict mode |
| `tsconfig.node.json` | Vite plugin (`vite/`) | Separate compile — uses Node `fs` APIs and the Vite `Plugin` type |

The build command `tsc -b` compiles both projects incrementally (`.tsbuildinfo` files are generated), then `vite build` creates the production bundle into `dist/`.

## Output

Production build outputs to `dist/`. The CI deployment copies `dist/index.html` to `dist/404.html` so that GitHub Pages serves the SPA shell for unmatched client-side routes (deep links like `/courses/pid-control`).

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_BASE` | `/CyberAcademiK/` | GitHub Pages base path — auto-derived in CI from repo name |

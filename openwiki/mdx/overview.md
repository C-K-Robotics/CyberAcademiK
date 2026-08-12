---
type: mdx-overview
title: MDX Component System
description: How generic MDX components are defined, merged with course-specific components, and rendered via MDXProvider in the course reader.
tags: [mdx, components, mdx-provider, course-bundles, extension-points]
---

# MDX Component System

Courses authored in MDX can use React components as JSX blocks within their Markdown content. CyberAcademiK provides a layered component system: generic components available in every course, plus optional course-specific components.

## Architecture

```
┌──────────────────────────────────────────────────┐
│              Lesson MDX content                   │
│  <Section> <Callout> <Quiz> <Figure> ...         │
└───────────────┬──────────────────────────────────┘
                │
        ┌───────▼────────────────┐
        │  MDXProvider components │  ← merged set
        │  generic + course-spec  │
        └───────┬────────────────┘
                │
        ┌───────▼────────────────┐
        │  Wrapper (optional)     │  ← PidGainsProvider etc.
        │  course-specific        │
        └───────┬────────────────┘
                │
        ┌───────▼────────────────┐
        │  Lazy MDX content       │  ← code-split bundle
        └────────────────────────┘
```

## Component sources

### Generic components (`src/mdx/components.tsx`)

Every course gets these generic components, defined in `genericMdxComponents`:

```tsx
export const genericMdxComponents: MDXComponents = {
  ...proseComponents,    // img, p, h2, h3, h4, strong, pre, code, blockquote, ul, ol, table, etc.
  Section,               // Numbered section with data-section attributes
  Slide,                 // Slide break marker
  Callout,               // Info/tip/warn aside box
  Quiz,                  // Interactive MCQ
  Q,                     // Quiz question wrapper
  Choice,                // Answer choice
  Prompt,                // Question prompt
  Explain,               // Explanation text
  CodeTabs,              // Tabbed code viewer
  CodeTab,               // Code tab marker
  Figure,                // Captioned image with assetUrl resolution
}
```

### Course-specific components (`src/courses/<slug>/index.tsx`)

Each course may provide a `CourseBundle`:

```tsx
interface CourseBundle {
  components: MDXComponents       // Additional MDX components
  Wrapper?: ComponentType<{ children: ReactNode }>  // Optional provider
}
```

Currently only `pid-control` has a bundle with 6 components: `BlockDiagram`, `PlantSchematic`, `ThreeTerms`, `PIDSimulator`, `ZieglerNichols`, `ArmSimulator`.

### Merge process (`CourseLayout`)

```tsx
const components = useMemo(
  () => ({ ...genericMdxComponents, ...module.components }),
  [module],
)
```

Course-specific components are spread **after** generic ones, so they can override generic component names if needed.

## How MDX compilation works

The Vite pipeline in `vite.config.ts`:

```ts
{
  enforce: 'pre',
  ...mdx({
    providerImportSource: '@mdx-js/react',  // ← critical: tells MDX compiler to import MDXProvider from @mdx-js/react
    remarkPlugins: [remarkGfm],              // GitHub Flavored Markdown
    rehypePlugins: [rehypeSlug],             // Auto-generate IDs from headings
  }),
}
```

The `providerImportSource: '@mdx-js/react'` option is essential — it tells the MDX compiler to generate imports like `import { useMDXComponents } from '@mdx-js/react'` rather than generating inline provider code. This allows `CourseLayout` to wrap the lazy MDX component with its own merged `MDXProvider` at render time.

The `courseContent()` plugin (see `vite/course-content.ts`) runs **before** the MDX compiler, scanning the content directory to generate `virtual:course-catalog`. It strips YAML frontmatter so the MDX compiler never sees it.

## MDX styling layers

1. **Theme CSS** (`src/styles/theme.css`) — CSS custom properties available everywhere
2. **Prose components** (`src/mdx/prose.tsx`) — styled overrides for markdown elements (p, h2, h3, pre, code, img, table, blockquote, ul, ol, strong, em)
3. **MDX component CSS** (`src/mdx/mdx.css`) — component-specific overrides (code tab pre box, lesson-prose link underline, quiz inline markdown)
4. **Course content CSS** (`src/components/course/course.css`) — layout rules for the reader chrome

## MDX content loading

MDX files under `/content/**/*.mdx` are loaded via Vite's glob imports:

```ts
const CONTENT_LOADERS = import.meta.glob('/content/**/*.mdx') as Record<string, ContentLoader>
```

Each course has per-locale files (e.g., `en.mdx`, `zh-Hant.mdx`). The discovery system creates lazy loaders keyed by locale:

```ts
for (const locale of raw.locales) {
  const loader = CONTENT_LOADERS[raw.contentPaths[locale]]
  if (loader) content[locale as Locale] = loader
}
```

The course reader then picks the active locale, falls back to English, then falls back to any available locale.

## Content path conventions

MDX files reference public assets using **root-relative paths** (e.g., `/intro-to-robotics/ur5.png`). These paths are resolved at runtime by:

1. **`Figure` component** — calls `assetUrl(src)` to prepend the deploy base path
2. **Prose `img` override** — same `assetUrl()` resolution

Without this, images would resolve to wrong URLs under the GitHub Pages sub-path (`/CyberAcademiK/`).

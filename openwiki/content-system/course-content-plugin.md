---
type: content-plugin
title: Course Content Vite Plugin
description: The custom Vite plugin that scans the content/ directory at build time, parses MDX frontmatter with js-yaml, and generates the virtual:course-catalog module.
tags: [vite, plugin, content, build-time, virtual-module]
---

# Course Content Vite Plugin

The `courseContent()` plugin in `vite/course-content.ts` is the build-time engine that makes content auto-discovery possible. It walks the `content/` directory, reads category metadata, subcategory metadata, and MDX frontmatter, then emits a virtual module.

## Virtual module generated

```ts
// virtual:course-catalog
export const CATALOG: RawCatalog
```

This module exports a `CATALOG` object with a `categories` array that mirrors the directory structure exactly. The module is declared in `src/vite-env.d.ts`:

```ts
declare module 'virtual:course-catalog' {
  import type { RawCatalog } from './content/raw'
  export const CATALOG: RawCatalog
}
```

## Plugin workflow

1. **Scan `content/` directory** — recursively walk all subdirectories.
2. **Read `_category.json`** — for each top-level directory (category), read the sidecar JSON to get `id`, `order`, `icon`, `accent`, and localized `title`, `blurb`, `tags`.
3. **Read `_subcategory.json`** — for each subcategory directory, read the sidecar to get `id`, `order`, and localized `name`.
4. **Parse MDX frontmatter** — for each course directory (leaf), read every `.mdx` file (e.g. `en.mdx`, `zh-Hant.mdx`), strip the YAML frontmatter, parse it with `js-yaml`, and collect:
   - `slug` (folder name)
   - `locales` array
   - `contentPaths` mapping locale → relative path
   - All frontmatter fields: `title`, `desc`, `kicker`, `lead`, `updated`, `references`, `upNext`, `author`, `minutes`, `level`, `isNew`, `order`
5. **Generate the module** — assemble `RawCategory[]` → `RawCatalog` and export as `CATALOG`.

## Key characteristics

- **Runs at build time only.** The plugin executes during `vite build` (or `vite dev`), never in the browser.
- **Strips frontmatter.** The plugin reads and parses YAML frontmatter but strips it before the content reaches the MDX compiler, so the compiled component only sees the markdown body.
- **Deterministic.** Given the same `content/` tree, the plugin produces identical output. No randomness, no external dependencies.
- **No config required.** The plugin discovers everything from the directory structure — no registration, no manifest files, no database.

## Vite plugin API

The plugin implements the Vite `Plugin` interface:

```ts
function courseContent(): Plugin {
  return {
    name: 'course-content',
    enforce: 'pre',  // Must run before MDX compiler
    resolveId(source) {
      if (source === 'virtual:course-catalog') return { id: source }
    },
    load(id) {
      if (id === 'virtual:course-catalog') {
        // Generate and return the module code string
      }
    },
  }
}
```

The `enforce: 'pre'` ordering ensures it runs before the MDX compiler plugin, so frontmatter is stripped before MDX sees the file.

---
type: content-assets
title: Static Assets
description: How CyberAcademiK handles static assets — the public/ directory structure, MDX image references, and the assetUrl() base-path resolution mechanism.
tags: [assets, static-files, public, image, base-path]
---

# Static Assets

CyberAcademiK serves static assets from the `public/` directory. Course content references these assets with root-relative paths, which are automatically resolved against the app's deploy base path at render time.

## Directory structure

```
public/
├── favicon.png                     # Site favicon (referenced in index.html)
└── intro-to-robotics/
    ├── robot-systems.png           # Course diagram
    └── ur5.png                     # UR5 robot arm photo
```

Currently, the only course assets are images for the "Intro to Robotics" lesson.

## MDX image referencing

MDX content references `public/` files using **root-relative paths** (starting with `/`):

```mdx
<Figure src="/intro-to-robotics/robot-systems.png" alt="Robot subsystems diagram" />
```

or standard markdown:

```mdx
![Robot subsystems](/intro-to-robotics/robot-systems.png)
```

The leading `/` is intentional — these paths are relative to the **deploy root**, not to the course file itself.

## `assetUrl()` resolution (`src/lib/assetUrl.ts`)

The `assetUrl()` function resolves root-relative paths against the app's base URL. It is called in two places:

1. **`Figure` component** — when rendering an `<img>` from MDX
2. **Prose `img` override** (`src/mdx/prose.tsx`) — when rendering standard markdown images

```ts
export function assetUrl(src: string): string {
  // Pass through absolute URLs, data URIs, and protocol-relative URLs
  if (src.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(src)) return src

  // Prepend the base path (e.g. /CyberAcademiK/)
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return `${base}/${src.replace(/^\//, '')}`
}
```

### Resolution behavior

| Input | Local dev output | GitHub Pages output |
|-------|-----------------|---------------------|
| `/intro-to-robotics/ur5.png` | `/intro-to-robotics/ur5.png` | `/CyberAcademiK/intro-to-robotics/ur5.png` |
| `https://example.com/img.png` | `https://example.com/img.png` | `https://example.com/img.png` |
| `data:image/png;base64,...` | `data:image/png;base64,...` | `data:image/png;base64,...` |
| `//cdn.example.com/img.png` | `//cdn.example.com/img.png` | `//cdn.example.com/img.png` |

## Adding course assets

1. Place the asset in `public/` (at the root or in a subdirectory like `public/<course-slug>/`).
2. Reference it in MDX with a root-relative path: `/path/to/asset.png`.
3. The `assetUrl()` function automatically prepends the correct base path at render time.

## Conventions

- **Organize by course:** Place assets under `public/<course-slug>/` to keep related images together.
- **Use descriptive filenames:** `pid-simulator-screenshot.png` rather than `img1.png`.
- **Root-relative paths:** Always use `/` prefix for public assets in MDX, never relative paths.

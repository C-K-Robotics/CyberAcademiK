---
type: content-authoring
title: Content Authoring Guide
description: Complete guide for content authors — directory structure, frontmatter fields, JSON sidecars, MDX component vocabulary, and how to add courses with interactive widgets.
tags: [authoring, content, mdx, guide, lessons]
---

# Content Authoring Guide

This guide captures the conventions and reference material for adding and editing courses in CyberAcademiK. Content managers work exclusively with files under `content/` — no code changes are needed for pure-content courses.

## Directory structure

```
content/
├── <category>/                           # Top-level category (Subteam)
│   ├── _category.json                    # Category metadata
│   ├── <subcategory>/                    # Subcategory (CourseGroup)
│   │   ├── _subcategory.json             # Subcategory metadata
│   │   └── <course-slug>/                # Course (folder name = URL slug)
│   │       ├── en.mdx                    # English lesson
│   │       └── zh-Hant.mdx               # Traditional Chinese lesson
│   └── …
```

**Three levels required:** category → subcategory → course. The course directory name is the URL slug (e.g. `pid-control` → `/courses/pid-control`).

## Sidecar JSON files

### `_category.json` (one per top-level category)

```json
{
  "id": "mech",
  "order": 1,
  "icon": "Hexagon",
  "accent": "--ac2",
  "title": { "en": "Mechanical & Design", "zh-Hant": "機械與設計" },
  "blurb": { "en": "From a blank Onshape document...", "zh-Hant": "從一份空白的 Onshape 文件..." },
  "tags": {
    "en": ["CAD", "Mechanisms", "Manufacturing"],
    "zh-Hant": ["CAD", "機構", "製造"]
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Yes | Short identifier, used in URL and code lookups |
| `order` | number | No | Sort position among categories |
| `icon` | string | Yes | Lucide icon name (e.g. "Hexagon", "Zap", "RefreshCw") |
| `accent` | string | Yes | CSS custom property name (e.g. "--ac2", "--ac6", "--ac1") |
| `title` | object | Yes | `{ en: "...", "zh-Hant": "..." }` |
| `blurb` | object | Yes | Short description |
| `tags` | object | Yes | `{ en: [...], "zh-Hant": [...] }` string arrays |

### `_subcategory.json` (one per subcategory)

```json
{
  "id": "mechanisms",
  "order": 1,
  "name": { "en": "Mechanisms", "zh-Hant": "機構" }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Yes | Short identifier |
| `order` | number | No | Sort position |
| `name` | object | Yes | `{ en: "...", "zh-Hant": "..." }` |

## YAML frontmatter (per MDX file)

Frontmatter sits at the top of each `.mdx` file between `---` markers:

```yaml
---
title: Intro to Robotics
desc: From sense to plan to act — a bird's-eye view of how robot software turns sensors into motion.
kicker: INTRO TO ROBOTICS
lead: >-
  Before a robot can *do* anything, it must first *understand*...
author: FRC 8020
minutes: 20
level: beginner
order: 1
references:
  - label: 'R.U.R. — Karel Čapek, 1920'
    href: 'https://en.wikisource.org/wiki/R.U.R.'
upNext:
  label: 'Control Theory'
  href: '#control-theory'
updated: '2026-08-10'
isNew: true
---
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | Display title |
| `desc` | string | No | Course description (shown in listing) |
| `kicker` | string | No | Eyebrow label (e.g. "INTRO TO ROBOTICS") |
| `lead` | string | No | Paragraph above title; supports inline markdown |
| `author` | string | No | Author / credit |
| `minutes` | number | No | Estimated time in minutes |
| `level` | string | No | `beginner` / `intermediate` / `advanced` |
| `order` | number | No | Position within subcategory |
| `references` | array | No | `{ label, href }` entries |
| `upNext` | object | No | `{ label, href }` for next lesson card |
| `updated` | string | No | Last updated date |
| `isNew` | boolean | No | Show "NEW" badge |

Fields with `en` frontmatter but missing `zh-Hant` will fall back to English in the UI.

## Adding a pure-content course

1. Create the directory path: `content/<category>/<subcategory>/<course-slug>/`
2. Create `en.mdx` with YAML frontmatter and your lesson content.
3. Optionally create `zh-Hant.mdx` for the same content in Traditional Chinese.

That's it. The course appears in the catalog, sidebar, and search automatically.

## Adding a course with interactive widgets

In addition to steps 1–3 above, you must:

1. Create `src/courses/<course-slug>/index.tsx` with a `CourseBundle` export:
   ```tsx
   import type { CourseBundle } from '../../content/types'
   import { MyWidget } from './MyWidget'

   const bundle: CourseBundle = {
     components: { MyWidget },
     Wrapper: undefined,  // optional state provider
   }
   export default bundle
   ```
2. Your MDX can now reference `<MyWidget />` as an inline component.

## MDX component vocabulary

The following components are available in every course's MDX. Authors use them directly in markdown files — no imports needed.

### `Section`

A numbered lesson section. Auto-discovers itself for the chip nav via `data-section` attribute.

```mdx
<Section id="robot-definition" n="01" title="What is a robot?">

Content goes here...

</Section>
```

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `id` | string | Yes | Stable identifier → DOM id is `sec-${id}` |
| `n` | string | Yes | Display number, e.g. "01" |
| `title` | string | Yes | Section heading |
| `chip` | string | No | Short label for chip nav (defaults to `title`) |

### `Slide`

A slide break inside a `<Section>`. In normal scroll mode the wrapper is invisible. In slide mode, each `<Slide>` becomes one navigable step.

```mdx
<Section id="overview" n="01" title="Overview">
  <Slide>Content block 1</Slide>
  <Slide>Content block 2</Slide>
</Section>
```

### `Callout`

A colored aside box for tips, notes, and warnings.

```mdx
<Callout type="info" title="Note">This is an informational note.</Callout>
<Callout type="tip">A helpful tip.</Callout>
<Callout type="warn">A warning.</Callout>
```

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `type` | `"info"` / `"tip"` / `"warn"` | `"info"` | Controls color and icon |
| `title` | string | No | Optional heading |

### `Quiz` / `Q` / `Choice`

Interactive multiple-choice knowledge check.

```mdx
<Quiz>
  <Q>
    <Prompt>What is the capital of France?</Prompt>
    <Explain>Paris is the capital and largest city of France.</Explain>
    <Choice>London</Choice>
    <Choice>Paris</Choice>
    <Choice correct>Paris</Choice>
    <Choice>Berlin</Choice>
  </Q>
</Quiz>
```

- `<Q>` wraps one question with one `<Prompt>`, zero or one `<Explain>`, and one or more `<Choice>` elements.
- Exactly one `<Choice>` should have the `correct` prop.
- The renderer shows a score, highlights correct/incorrect answers, and disables further interaction after answering.

### `CodeTabs` / `CodeTab`

A tabbed code viewer with a copy button.

```mdx
<CodeTabs>
  <CodeTab label="Drive.java">
```java
class Drive {
  public void move() {}
}
```
  </CodeTab>
  <CodeTab label="Drive.cpp">
```cpp
void Drive::move() {}
```
  </CodeTab>
</CodeTabs>
```

### `Figure`

A captioned image with automatic base-path resolution.

```mdx
<Figure src="/intro-to-robotics/robot-systems.png" alt="Robot subsystems diagram" caption="Mechatronic system overview" width="80%" />
```

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `src` | string | Yes | Path under `public/` (auto-resolved against base URL) |
| `alt` | string | `""` | Alt text |
| `caption` | ReactNode | No | Caption below image |
| `width` | string | `"100%"` | CSS width, e.g. `"60%"`, `"400px"` |

### Markdown prose

<!-- openwiki: broken internal link [url] file "url" does not exist. Fix the href or restore the target, then delete this comment. -->
Standard markdown is supported: paragraphs, headings (`#`, `##`, `###`), bold (`**text**`), italic (`*text*`), inline code (`` `code` ``), links `[label](url)`, lists (`- item`), blockquotes (`> text`), and tables (`| col | col |`). The prose rendering applies consistent typography (IBM Plex Mono for monospace, IBM Plex Sans for body).

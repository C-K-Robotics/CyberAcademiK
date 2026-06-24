# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with content in this directory.

This is the **`content/` tree** — the authoring surface of CyberAcademiK. Courses are **auto-discovered from this directory at build time; nothing is registered in code.** The directory layout *is* the taxonomy and the catalog. (For the build pipeline and app code, see the root `CLAUDE.md`.)

## Directory structure

```
content/<category>/<sub-category>/<course-slug>/<locale>.mdx
        │           │             │             └─ one file per locale (en.mdx, zh-Hant.mdx)
        │           │             └─ course-slug = the URL slug, reachable at /courses/<slug>,
        │           │                AND the folder name a custom code bundle is matched against
        │           ├─ _subcategory.json (sidecar — describes this sub-category)
        │           └─ <sub-category>/ …
        └─ _category.json (sidecar — describes this category)
```

- `<category>` is a **subteam** in the UI (currently `control-programming`, `electrical`, `mechanical-design`).
- `<sub-category>` is a course group within a subteam.
- `<course-slug>` is one course. Slugs must be **globally unique across the whole tree** — routing and `getCourseModule` key on slug alone, not on path.
- A category/sub-category dir with no course beneath it is a valid **curriculum skeleton** (sidecar-only) and renders as "Coming soon". Counts are derived everywhere — never assume a number of courses.

Currently only `control-programming/control-theory/pid-control` has a real lesson; everything else is sidecar-only skeleton. Use `pid-control/en.mdx` as the reference for authoring.

## Metadata: where each field lives

There is **no `meta.ts`/`catalog.ts` data file** — every metadata field comes from one of three places, all in this tree.

### Course frontmatter — YAML at the top of each `<locale>.mdx`

Localized simply by being per-locale-file. The build plugin (`vite/course-content.ts`) strips this block before the MDX compiles, so it never renders. Fields actually consumed (see `CourseMeta` in `src/content/types.ts`):

| Field | Notes |
| --- | --- |
| `title` | Course title. |
| `desc` | Short catalog/card description. |
| `kicker` | Eyebrow label above the title, e.g. `PID CONTROL`. The `LESSON nn / nn` counter is appended automatically at render time — **don't** write it here. |
| `lead` | Intro paragraph on the lesson page. |
| `author` | Plain string (not localized). |
| `minutes` | Number — estimated working time; feeds derived totals. |
| `level` | `beginner` \| `intermediate` \| `advanced`. |
| `order` | Sort order within the sub-category. |
| `isNew` | Boolean — shows the "new" badge. |
| `updated` | Free text, e.g. `Updated Oct 2025`. |
| `references` | List of `{ label, href }`. |
| `upNext` | `{ label, href }` for the next-lesson link. |

### `_category.json` — one per category dir (the subteam card)

`id, order, icon, accent, title, blurb, tags`.
- `icon` — a **lucide-react icon name** (e.g. `RefreshCw`).
- `accent` — a CSS custom-property name from `src/styles/theme.css` (e.g. `--ac1`; `--ac1-rgb` is derived for rgba).
- `title`, `blurb`, `tags` — `{ [locale]: value }` maps (`tags` is a map of string arrays).

### `_subcategory.json` — one per sub-category dir

`id, order, name` — `name` is a localized `{ [locale]: value }` map.

Missing localized fields backfill from the default locale (`discovery.ts`'s `fill()`), so a new locale's MDX can ship incrementally.

## Adding content

- **Pure-content course:** drop `content/<cat>/<sub>/<slug>/<locale>.mdx` (one per locale) with frontmatter as above. It appears in the catalog and counts automatically — no code changes. Verify with `yarn build` and a browser check at `/courses/<slug>`.
- **Course with custom widgets:** also add `src/courses/<slug>/index.tsx` (default export a `CourseBundle`). The folder name **must equal the course slug** — that's the only thing wiring the code to this content. See "Custom components" below.
- **New category / sub-category:** create the directory with a `_category.json` / `_subcategory.json` sidecar — copy the shape of an existing one.

The dev server watches `content/` and full-reloads on any change, so edits show up live.

## Authoring MDX: the generic component vocabulary

A lesson is prose plus components. These components are available in **every** course's MDX with **no import statement** (registered in `src/mdx/components.tsx`; prose elements like headings, code, and tables are styled by `src/mdx/prose.tsx`):

- `<Section id n title chip>` — a numbered lesson section. `n` is the displayed number string (e.g. `"01"`), `chip` a small label. Wraps the section's prose and components.
- `<Callout type title>` — coloured aside; `type` is `info` (default) \| `tip` \| `warn`.
- `<CodeTabs>` containing one `<CodeTab label="…">` per language, each wrapping a single fenced code block — a tabbed viewer with a copy button.
- `<Quiz>` → `<Q prompt explain>` → `<Choice correct>` — `Q`/`Choice` are inert markers parsed and rendered by `Quiz`. Mark the right answer with `correct`; `explain` shows after answering.
- `<Figure src alt caption>` — image with caption.

## Custom components (course-specific widgets)

When a lesson needs interactive widgets (like the PID simulators), add a bundle at `src/courses/<slug>/index.tsx` whose default export is a `CourseBundle`:

```ts
const bundle: CourseBundle = {
  Wrapper: PidGainsProvider,          // optional: wraps the rendered lesson (shared state, providers)
  components: { BlockDiagram, PIDSimulator, /* … */ },
}
export default bundle
```

- `components` are **merged over the generic set** for this course's MDX, so a custom name shadows a generic one. Reference them in MDX exactly like the generic components — no import in the `.mdx`.
- `Wrapper` wraps the whole rendered lesson — use it to share state across widgets (e.g. `PidGainsProvider` lets the Ziegler–Nichols calculator push gains into the live simulator).
- The match is **by folder name = slug**, nothing else. `src/courses/pid-control/` is the reference example.

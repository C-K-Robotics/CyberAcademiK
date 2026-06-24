# CyberAcademiK

An interactive learning library for FRC robotics — mechanical design, electrical,
and control × programming. Lessons are authored in **MDX** and compiled to a static
site with **Vite**, then published to **GitHub Pages** via GitHub Actions.

## Tech stack

- React + TypeScript + Vite (Yarn)
- [`lucide-react`](https://lucide.dev) icons
- MDX content pipeline (`@mdx-js/rollup`) with `remark-gfm` + `rehype-slug`
- No backend — everything is static and computed at build time

## Getting started

```bash
yarn install
yarn dev        # start the dev server
yarn build      # typecheck + production build into dist/
yarn preview    # preview the production build locally
```

> The site is served from a sub-path on GitHub Pages (`/CyberAcademiK/`), so the
> dev server and preview run under that base too — open the URL Vite prints.

## How content works

All content lives in the root **`content/`** directory and is **auto-discovered** at
build time — nothing is registered in code. The directory layout *is* the taxonomy:

```
content/
├── control-programming/                 # category  (first level)
│   ├── _category.json                   #   id, order, icon, accent, localized title/blurb/tags
│   └── control-theory/                  # sub-category (second level)
│       ├── _subcategory.json            #   id, order, localized name
│       └── pid-control/                 # course (folder name = slug)
│           ├── en.mdx                   #   English lesson  — metadata in YAML frontmatter
│           └── zh-Hant.mdx              #   Traditional Chinese lesson
└── …                                    # mechanical-design/, electrical/, …
```

Every course's metadata (title, lead, author, level, minutes, references,
`upNext`, `isNew`, …) lives in the **YAML frontmatter** at the top of each locale's
MDX file — never in code. A Vite plugin (`vite/course-content.ts`) scans `content/`
into a `virtual:course-catalog` module; `src/content/discovery.ts` turns that into the
typed catalog, lazy MDX loaders, and course lookups. All counts (courses, subteams,
per-group) are derived, so the UI always matches what exists. The in-course sidebar
is likewise derived from the catalog — it lists the current subteam's sub-categories
and the real courses inside them, so it can't drift from `content/`.

**Content managers edit the `.mdx` files.** They write normal Markdown and drop in
components — no code required:

- **Generic** components (in `src/mdx/`), available to every course: `Section`,
  `Callout`, `Quiz` / `Q` / `Choice`, `CodeTabs` / `CodeTab`, `Figure`.
- **Course-specific** components (e.g. the PID simulators) live under
  `src/courses/<slug>/` and are auto-attached to the matching course by slug.

Each language is a separate MDX file; the active language is chosen in the header.

### Adding a course

1. Create `content/<category>/<sub-category>/<slug>/<locale>.mdx` with YAML
   frontmatter and your lesson. That's enough for a pure-content course — it appears
   in the catalog and counts automatically.
2. *(Only if it needs custom widgets)* add `src/courses/<slug>/index.tsx` whose
   **default export** is a `CourseBundle` (`{ components, Wrapper? }`). It is matched
   to the course by folder name.

To add a whole category or sub-category, create the directory with a `_category.json`
/ `_subcategory.json` sidecar (see existing ones for the shape).

## Internationalisation

UI chrome strings live in `src/i18n/strings.ts` (English + Traditional Chinese).
Course content is per-locale MDX. Add a locale by extending `LOCALES` and providing
the matching strings + MDX files.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and
publishes `dist/` to GitHub Pages. Enable Pages → "GitHub Actions" in the repository
settings once.

---

Course content by FRC#8020 Mentors & Members · Tutorial site by Nathan Lee.

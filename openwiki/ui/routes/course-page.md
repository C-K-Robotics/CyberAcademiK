---
type: course-page
title: Course Page & Reader
description: The lesson reader page — CourseLayout with sidebar navigation, sticky chip nav, slide mode, MDXProvider rendering, and per-course wrapper providers.
tags: [course, reader, mdx-rendering, slide-mode, sidebar, layout]
---

# Course Page & Reader

The course reader (`/courses/:slug`) displays a single lesson with full interactive chrome: sidebar navigation, chip nav, slide mode, and MDX content rendering.

## Component tree

```
CoursePage (CoursePage.tsx)
└── CourseLayout (CourseLayout.tsx)      ← wraps everything
    ├── CourseSidebar (left, fixed)
    │   ├── BrandLogo link to home
    │   ├── Subteam title
    │   ├── Subcategory groups (modules)
    │   │   └── Course lessons (bulleted list)
    │   └── Course search
    ├── CourseOverlay (mobile drawer bg)
    ├── CourseTopbar (sticky header)
    │   ├── Hamburger toggle
    │   ├── Breadcrumb
    │   ├── CourseSearch
    │   ├── Slide mode toggle
    │   ├── LanguageSwitcher
    │   └── ThemeToggle
    ├── ChipNav (sticky, below topbar)
    ├── SlideDeck (full-screen step viewer)
    └── course-content (main content area)
        ├── LessonHeader (eyebrow, title, meta)
        ├── MDXProvider (with merged components)
        │   └── Wrapper (optional course-specific provider)
        │       └── Lazy MDX content
        └── CourseFooterNav (up-next + references)
```

## CoursePage (`src/components/course/CoursePage.tsx`)

```tsx
export function CoursePage() {
  const { slug } = useParams<{ slug: string }>()
  const module = slug ? getCourseModule(slug) : undefined
  if (!module) return <NotFound />
  return <CourseLayout key={module.meta.slug} module={module} />
}
```

The `key` prop on `CourseLayout` forces a full remount when the course changes (instead of reusing the instance), which is important because the course-specific `Wrapper` provider may differ between courses.

## CourseLayout (`src/components/course/CourseLayout.tsx`)

### Component resolution

Merges generic MDX components with course-specific ones:

```tsx
const components = useMemo(
  () => ({ ...genericMdxComponents, ...module.components }),
  [module],
)
```

Generic components come from `src/mdx/components.tsx` (prose overrides, Section, Callout, Quiz, CodeTabs, Figure, Slide). Course-specific components come from the `CourseBundle`.

### Locale-aware lazy loading

```tsx
const loader =
  module.content[locale] ??
  module.content[DEFAULT_LOCALE] ??
  Object.values(module.content).find(Boolean)
const Lazy = useMemo(() => (loader ? lazy(loader) : null), [loader])
```

The loader picks the active locale's content, falls back to English, then falls back to any available locale. The content is wrapped in React `lazy()` for code-splitting — the MDX bundle is only downloaded when this route is first visited.

### Wrapper provider

```tsx
const Wrapper = module.Wrapper ?? Fragment
```

If a course has a `CourseBundle` with a `Wrapper` (e.g., `PidGainsProvider`), it wraps the MDX content, enabling shared state between course-specific components.

### Sidebar toggle (responsive)

```tsx
const toggleNav = () => {
  if (window.matchMedia('(max-width:820px)').matches) setNavOpen((o) => !o)
  else setNavCollapsed((c) => !c)
}
```

- **Mobile (< 820px)**: Sidebar is an off-canvas drawer with an overlay. `navOpen` toggles visibility.
- **Desktop (≥ 820px)**: Sidebar is always visible as a fixed panel. `navCollapsed` slides it left (data-collapsed).

### Slide mode

When active, replaces the normal content area with `SlideDeck`. The `ChipNav` is hidden in slide mode.

```tsx
{slideMode && <SlideDeck slug={meta.slug} onExit={exitSlide} />}
{!slideMode && <ChipNav contentKey={`${meta.slug}:${locale}`} />}
```

## Sidebar (`src/components/course/CourseSidebar.tsx`)

The sidebar is fixed at 264px on desktop, slides off-canvas on mobile. It shows:

1. **BrandLogo** at top (links to home)
2. **Subteam title** in the active locale
3. **Subcategory groups** — each group header shows the localized name with a "NOW" badge if the current course is in that group
4. **Course lessons** — bulleted list with filled dot for current lesson, hollow ring for others. Clicking navigates to `/courses/<slug>`.
5. **Course search** — at the bottom of the sidebar

## CSS layout

| Element | Desktop (≥ 821px) | Mobile (≤ 820px) |
|---------|-------------------|------------------|
| Sidebar | Fixed, 264px left, margin-left on main | Off-canvas (translateX(-100%)), slides in |
| Main | margin-left: 264px | margin-left: 0, full width |
| Overlay | Hidden | Displayed when sidebar open |
| Collapse | `data-collapsed` → margin-left: 0 | Toggles `data-open` |

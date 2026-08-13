---
type: course-reader-components
title: Course Reader Components
description: Course-specific chrome — CourseTopbar, CourseSidebar, ChipNav, SlideDeck, LessonHeader, and CourseFooterNav.
tags: [course-reader, sidebar, chip-nav, slide-mode, lesson-header, footer-nav]
---

# Course Reader Components

These components form the interactive chrome surrounding MDX lesson content. They handle navigation, slide mode, section tracking, and lesson metadata display.

## CourseTopbar (`src/components/course/CourseTopbar.tsx`)

A sticky header (58px tall) with `backdrop-filter: blur(10px)` that sits above the chip nav and content. Contains:

```
[menu-btn] [breadcrumb: Library / <subteam> / <lesson>] [search] [slide-toggle] [lang] [theme]
```

### Hamburger menu

```tsx
<button className="course-hamburger" onClick={onToggleNav} title={t.menu}>
  <Menu size={17} />
</button>
```

Toggles sidebar open (mobile) or collapsed (desktop) based on media query.

### Breadcrumb

Shows `Library / <Subteam title> / <Lesson title>` with active breadcrumb in bold and clickable ancestors.

### Slide mode toggle

```tsx
<button className="course-slide-toggle" onClick={onToggleSlide}>
  {slideMode ? <MonitorOff size={16} /> : <Monitor size={16} />}
</button>
```

Toggles full-screen slide mode.

## CourseSidebar (`src/components/course/CourseSidebar.tsx`)

Fixed 264px panel showing the course taxonomy derived live from the catalog:

```
[BrandLogo to home]
[Subteam title]
  [Subcategory: "Mechanisms" · NOW]
    ● Current lesson (filled dot)
    ○ Other lessons (hollow ring, links)
  [Subcategory: "CAD Modeling"]
    ○ Lessons...
[CourseSearch at bottom]
```

### Current lesson detection

```tsx
const isCurrentModule = group.courses.some((c) => c.slug === meta.slug)
```

If any course in the group matches the current slug, the group header gets a "NOW" badge.

### Lesson row rendering

```tsx
function LessonRow({ course, current, locale, onNavigate }) {
  const style = {
    borderLeft: current ? '2px solid var(--ac1)' : '2px solid transparent',
    background: current ? 'rgba(var(--ac1-rgb),0.08)' : 'transparent',
    paddingLeft: current ? 16 : 18,
    color: current ? 'var(--tx-strong)' : 'var(--tx-3)',
  }
  return current
    ? <div style={style} aria-current="page">{dot}{title}</div>
    : <Link to={`/courses/${course.slug}`} onClick={onNavigate} style={style}>{dot}{title}</Link>
}
```

### Responsive behavior

- **Mobile (≤ 820px):** Hidden off-canvas, slides in with `data-open="true"`, overlay behind it
- **Desktop (≥ 821px):** Fixed 264px, `data-collapsed` removes the margin-left from main content

## ChipNav (`src/components/course/ChipNav.tsx`)

A sticky horizontal bar (below the 58px topbar) showing section navigation chips. It **discovers sections from the DOM** — no registration needed.

### Discovery mechanism

```tsx
// Initial scan
const els = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'))
const next: Chip[] = els.map((el) => ({
  id: el.dataset.section ?? '',
  n: el.dataset.n ?? '',
  label: el.dataset.chip ?? '',
}))
```

Each section `<Section>` in the MDX renders with `data-section`, `data-n`, and `data-chip` attributes. These are read by the ChipNav.

### Scroll tracking

Uses an `IntersectionObserver` to detect which section is currently visible:

```tsx
const io = new IntersectionObserver(
  (entries) => {
    const visible = entries.filter(e => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
    if (visible[0]) setActive((visible[0].target as HTMLElement).dataset.section)
  },
  { rootMargin: '-120px 0px -65% 0px', threshold: 0 }
)
```

The `rootMargin` excludes the topbar (118px) and chip nav (30px) from visibility calculations.

### Locale swap handling

Because MDX content is lazily code-split and re-mounts on locale change, a one-shot scan would miss the content. The solution uses a **MutationObserver** on `.course-content`:

```tsx
const mo = new MutationObserver(schedule)
mo.observe(target, { childList: true, subtree: true })
```

This detects DOM changes (new sections appearing after locale swap) and re-scans automatically. A content key (`slug + locale`) resets the scan when the lesson itself changes.

## SlideDeck (`src/components/course/SlideDeck.tsx`)

Full-screen slide mode that shows one `<Section>` or `<Slide>` at a time. Navigation via prev/next buttons or keyboard.

### Step discovery

```tsx
function collectSlides(): SlideItem[] {
  const out: SlideItem[] = []
  document.querySelectorAll<HTMLElement>('.lesson-prose [data-section]').forEach((section) => {
    const breaks = section.querySelectorAll<HTMLElement>('[data-slide]')
    if (breaks.length === 0) {
      out.push({ el: section, section, n: section.dataset.n ?? '', index: 1, total: 1, isWholeSection: true })
      return
    }
    breaks.forEach((el, i) => {
      out.push({ el, section, n: section.dataset.n ?? '', index: i + 1, total: breaks.length, isWholeSection: false })
    })
  })
  return out
}
```

- Sections **without** `<Slide>` breaks are single steps
- Sections **with** `<Slide>` breaks are multi-step (each `<Slide>` is one step)
- The section heading stays fixed; only the step content toggles

### Position persistence

```tsx
const STORAGE_KEY = 'cyberacademik:slide-mode'
// Saves { [slug]: index } in localStorage
```

### Polling for lazy content

The lesson body is lazily mounted, so the SlideDeck polls for up to 100 frames (~1.5s) to discover steps:

```tsx
if (found.length === 0) {
  if (attempts++ < MAX_SCAN_FRAMES) frame = requestAnimationFrame(scan)
  return
}
```

### Typing protection

```tsx
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
}
```

Keyboard navigation (←/→) is suppressed while the user is in an input field.

## LessonHeader (`src/components/course/LessonHeader.tsx`)

Displays lesson metadata above the content:

```
LESSON 03 / 05 · INTRO TO ROBOTICS
# Intro to Robotics
Interactive tutorials across the three disciplines...

👤 FRC 8020  ◷ 20 min  ⚡ Beginner  ↻ 2026-08-10
```

The lesson counter "LESSON 03 / 05" is **derived** from the course's position in its subcategory (not authored in frontmatter):

```ts
const pos = getLessonPosition(meta.slug)  // { number: 3, total: 5 }
```

The kicker label ("INTRO TO ROBOTICS") comes from frontmatter and is combined with the counter at render time.

## CourseFooterNav (`src/components/course/CourseFooterNav.tsx`)

Two-column footer below lesson content:

### Up Next card (left)

```tsx
{upNext ? (
  <div className="gradient-card">
    <div>UP NEXT · {upNext.label}</div>
    <ArrowRight />
  </div>
) : <div />}
```

### References (right)

```tsx
<div className="references-panel">
  {references.map((ref) => (
    <a href={ref.href} target="_blank" rel="noopener noreferrer">
      <ExternalLink /> {ref.label}
    </a>
  ))}
</div>
```

## course.css

Key rules in `src/components/course/course.css`:

| Rule | Purpose |
|------|---------|
| `.course-sidebar` | Fixed panel, 264px, scrollable |
| `.course-main` | Main content area with left margin on desktop |
| `.course-overlay` | Darkened overlay for mobile drawer |
| `.course-hamburger` | Menu toggle button |
| `.course-chipnav .chip` | Section chip buttons, accent highlight on active |
| `@media (min-width: 821px) .course-sidebar[data-collapsed]` | Desktop collapse animation |
| `@media (max-width: 820px) .course-sidebar[data-open]` | Mobile drawer open |

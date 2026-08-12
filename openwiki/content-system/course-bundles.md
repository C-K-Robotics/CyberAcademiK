---
type: course-bundles
title: Course Bundles
description: The optional course bundle system — how courses with interactive widgets register custom React components to be used inside their MDX content.
tags: [course-bundles, mdx-components, extension, pid-control]
---

# Course Bundles

Pure-content courses need **zero code** — they exist entirely as MDX files under `content/` and render with the generic MDX component set. Courses that need interactive widgets (live simulators, calculators, custom diagrams) can provide a **course bundle**: a React component file that exports a `CourseBundle` object.

## How it works

1. **Convention over configuration.** If a directory exists at `src/courses/<slug>/index.tsx`, where `<slug>` matches a course directory under `content/`, it is treated as that course's bundle.
2. **Eager import.** The discovery layer imports all bundles at module initialization via:
   ```ts
   const COURSE_BUNDLES = import.meta.glob('/src/courses/*/index.tsx', {
     eager: true,
     import: 'default',
   }) as Record<string, CourseBundle>
   ```
3. **Slug extraction.** A regex `/\/src\/courses\/([^/]+)\/index\.tsx$/` extracts the slug from each import path and populates `BUNDLE_BY_SLUG`.
4. **Merge at render time.** `CourseLayout` merges generic MDX components with course-specific ones:
   ```ts
   const components = useMemo(
     () => ({ ...genericMdxComponents, ...module.components }),
     [module],
   )
   ```
5. **Optional wrapper provider.** If a bundle provides a `Wrapper`, it is used to wrap the rendered MDX content, enabling shared state between course-specific components.

## `CourseBundle` interface

```ts
interface CourseBundle {
  /** Components made available to this course's MDX (merged over the generic set). */
  components: MDXComponents
  /** Optional provider wrapping the rendered MDX (e.g. shared simulator state). */
  Wrapper?: ComponentType<{ children: ReactNode }>
}
```

## Current bundle: pid-control

The only course with a bundle so far is `pid-control` (`src/courses/pid-control/index.tsx`):

```tsx
const bundle: CourseBundle = {
  Wrapper: PidGainsProvider,  // Shared PID gains context provider
  components: {
    BlockDiagram,              // SVG block diagram of PID loop
    PlantSchematic,            // SVG mass-spring-damper schematic
    ThreeTerms,                // Rendered PID equation display
    PIDSimulator,              // HiDPI canvas-based PID simulator
    ZieglerNichols,            // Interactive Ziegler-Nichols calculator
    ArmSimulator,              // 2DOF arm simulator with PID control
  },
}
```

## Adding a new course bundle

1. Create `src/courses/<slug>/index.tsx`.
2. Define and export your custom MDX components (React components).
3. Create a default export of type `CourseBundle` with `components: { ComponentName, ... }`.
4. Optionally add a `Wrapper` provider component for shared state.
5. The course must already exist in `content/<category>/<subcategory>/<slug>/` for the slug to match.

## Lifecycle and invariants

- **Bundles are eagerly loaded.** They are imported at module initialization, not lazily. This is intentional so the `Wrapper` provider can be hoisted above the lazy MDX content in `CourseLayout`.
- **The wrapper is not code-split.** Because the wrapper wraps `<Suspense>` boundaries, it must be available immediately when the course route mounts.
- **Component names must match MDX references.** If an MDX file uses `<PIDSimulator />`, the bundle must export a component named `PIDSimulator` in its `components` object.

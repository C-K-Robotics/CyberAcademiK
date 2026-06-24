import { CATALOG } from 'virtual:course-catalog'
import { LOCALES, DEFAULT_LOCALE } from '../i18n/strings'
import type { Locale } from '../i18n/strings'
import { resolveIcon } from './icons'
import type {
  CourseBundle,
  CourseEntry,
  CourseMeta,
  CourseModule,
  Level,
  Localized,
  Subteam,
} from './types'
import type { RawCatalog, RawCourse } from './raw'
import type { ComponentType } from 'react'
import type { MDXComponents } from 'mdx/types'

/**
 * Course discovery. The taxonomy and per-course metadata come from
 * `virtual:course-catalog` (scanned from content/ at build time). The renderable
 * pieces are wired up here from two globs:
 *
 *  - the lazy MDX bodies under content/ (code-split per course + locale)
 *  - each course's optional code bundle under src/courses/<slug>/index.tsx
 *
 * Adding a course never touches this file: drop an MDX into content/, and (only
 * if it needs custom widgets) a matching src/courses/<slug>/ folder.
 */

type ContentLoader = () => Promise<{ default: ComponentType<{ components?: MDXComponents }> }>

const CONTENT_LOADERS = import.meta.glob('/content/**/*.mdx') as Record<string, ContentLoader>

const COURSE_BUNDLES = import.meta.glob('/src/courses/*/index.tsx', {
  eager: true,
  import: 'default',
}) as Record<string, CourseBundle>

const BUNDLE_BY_SLUG: Record<string, CourseBundle> = {}
for (const [path, bundle] of Object.entries(COURSE_BUNDLES)) {
  const match = path.match(/\/src\/courses\/([^/]+)\/index\.tsx$/)
  if (match) BUNDLE_BY_SLUG[match[1]] = bundle
}

// The virtual module is typed loosely through the ambient declaration; pin it here.
const categories = (CATALOG as RawCatalog).categories

/** Expand a per-locale map to a full Localized<T>, filling gaps from the default locale. */
function fill<T>(byLocale: Record<string, T>, fallback: T): Localized<T> {
  const def = byLocale[DEFAULT_LOCALE] ?? Object.values(byLocale)[0] ?? fallback
  const out = {} as Localized<T>
  for (const locale of LOCALES) out[locale] = byLocale[locale] ?? def
  return out
}

function toCourseEntry(c: RawCourse): CourseEntry {
  return {
    slug: c.slug,
    title: fill(c.title, c.slug),
    desc: fill(c.desc, ''),
    level: c.level as Level,
    minutes: c.minutes,
    isNew: c.isNew || undefined,
  }
}

/** The full category taxonomy, with icons resolved and counts derived downstream. */
export const SUBTEAMS: Subteam[] = categories.map((cat) => ({
  id: cat.id,
  icon: resolveIcon(cat.icon),
  accent: cat.accent,
  accentRgb: `${cat.accent}-rgb`,
  title: fill(cat.title, cat.id),
  blurb: fill(cat.blurb, ''),
  tags: fill(cat.tags, []),
  groups: cat.groups.map((group) => ({
    id: group.id,
    name: fill(group.name, group.id),
    courses: group.courses.map(toCourseEntry),
  })),
}))

const RAW_BY_SLUG: Record<string, RawCourse> = {}
for (const cat of categories) {
  for (const group of cat.groups) {
    for (const course of group.courses) RAW_BY_SLUG[course.slug] = course
  }
}

function buildMeta(c: RawCourse): CourseMeta {
  return {
    slug: c.slug,
    subteamId: c.categoryId,
    title: fill(c.title, c.slug),
    kicker: fill(c.kicker, ''),
    lead: fill(c.lead, ''),
    author: c.author,
    minutes: c.minutes,
    level: c.level as Level,
    updated: fill(c.updated, ''),
    references: fill(c.references, []),
    upNext: c.upNext ? fill(c.upNext, { label: '', href: '#' }) : undefined,
  }
}

/** Resolve a renderable course module by slug, or undefined if no such course. */
export function getCourseModule(slug: string): CourseModule | undefined {
  const raw = RAW_BY_SLUG[slug]
  if (!raw) return undefined

  const bundle = BUNDLE_BY_SLUG[slug]
  const content: CourseModule['content'] = {}
  for (const locale of raw.locales) {
    const loader = CONTENT_LOADERS[raw.contentPaths[locale]]
    if (loader) content[locale as Locale] = loader
  }

  return {
    meta: buildMeta(raw),
    components: bundle?.components ?? {},
    Wrapper: bundle?.Wrapper,
    content,
  }
}

/** Total number of discovered courses (drives the hero meta). */
export const TOTAL_COURSES = Object.keys(RAW_BY_SLUG).length

export const TOTAL_SUBTEAMS = SUBTEAMS.length

export function courseCountForSubteam(subteam: Subteam): number {
  return subteam.groups.reduce((n, g) => n + g.courses.length, 0)
}

export function getSubteam(id: string): Subteam | undefined {
  return SUBTEAMS.find((t) => t.id === id)
}

/** Every discovered course is renderable; kept for call-site symmetry. */
export function isCourseAvailable(course: CourseEntry): boolean {
  return course.slug in RAW_BY_SLUG
}

/** Find a catalog entry (and its subteam) by slug — used for breadcrumbs etc. */
export function findCourseEntry(slug: string): { subteam: Subteam; course: CourseEntry } | undefined {
  for (const subteam of SUBTEAMS) {
    for (const group of subteam.groups) {
      const course = group.courses.find((c) => c.slug === slug)
      if (course) return { subteam, course }
    }
  }
  return undefined
}

/**
 * A course's 1-based position within its sub-category (module) and the module's
 * size — derived from the catalog order, never authored. Drives the
 * "LESSON 03 / 05" eyebrow. Returns undefined if the slug isn't in the catalog.
 */
export function getLessonPosition(slug: string): { number: number; total: number } | undefined {
  for (const subteam of SUBTEAMS) {
    for (const group of subteam.groups) {
      const i = group.courses.findIndex((c) => c.slug === slug)
      if (i !== -1) return { number: i + 1, total: group.courses.length }
    }
  }
  return undefined
}

import type { ComponentType, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Locale } from '../i18n/strings'
import type { MDXComponents } from 'mdx/types'

export type Localized<T> = Record<Locale, T>

export type Level = 'beginner' | 'intermediate' | 'advanced'

/** A course entry in the catalog taxonomy. Every discovered course is available. */
export interface CourseEntry {
  /** URL slug — the course's directory name. Reachable at /courses/:slug. */
  slug: string
  title: Localized<string>
  desc: Localized<string>
  level: Level
  /** Estimated reading/working time in minutes. */
  minutes: number
  isNew?: boolean
}

/** A sub-category (second directory level under content/). */
export interface CourseGroup {
  id: string
  name: Localized<string>
  courses: CourseEntry[]
}

/** A top-level category (first directory level under content/). */
export interface Subteam {
  id: string
  icon: LucideIcon
  /** CSS accent custom-property name, e.g. "--ac1". */
  accent: string
  /** e.g. "--ac1-rgb" — the comma-separated rgb triple used in rgba(). */
  accentRgb: string
  title: Localized<string>
  blurb: Localized<string>
  tags: Localized<string[]>
  groups: CourseGroup[]
}

export interface Reference {
  label: string
  href: string
}

export interface UpNext {
  label: string
  href: string
}

/**
 * A course's resolved metadata. Built at runtime from the per-locale MDX
 * frontmatter discovered in content/ — never authored in code.
 */
export interface CourseMeta {
  slug: string
  /** Owning category id (the catalog subteam). */
  subteamId: string
  title: Localized<string>
  /**
   * Short eyebrow label above the title, e.g. "PID CONTROL". The "LESSON nn / nn"
   * counter is appended at render time from the catalog (see getLessonPosition).
   */
  kicker: Localized<string>
  lead: Localized<string>
  author: string
  minutes: number
  level: Level
  updated: Localized<string>
  references: Localized<Reference[]>
  upNext?: Localized<UpNext>
}

/**
 * Optional course-specific code, auto-discovered from
 * src/courses/<slug>/index.tsx (its default export). Pure-content courses need
 * no bundle at all — they simply use the generic MDX components.
 */
export interface CourseBundle {
  /** Components made available to this course's MDX (merged over the generic set). */
  components: MDXComponents
  /** Optional provider wrapping the rendered MDX (e.g. shared simulator state). */
  Wrapper?: ComponentType<{ children: ReactNode }>
}

/** A fully resolved, renderable course (metadata + content loaders + code). */
export interface CourseModule {
  meta: CourseMeta
  components: MDXComponents
  Wrapper?: ComponentType<{ children: ReactNode }>
  /** Lazy per-locale MDX content loaders. */
  content: Partial<Record<Locale, () => Promise<{ default: ComponentType<{ components?: MDXComponents }> }>>>
}

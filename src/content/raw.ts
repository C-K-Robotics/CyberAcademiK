import type { Level } from './types'

/**
 * Shapes emitted by the `virtual:course-catalog` module (see
 * vite/course-content.ts). These mirror the on-disk `content/` files: localized
 * fields are keyed by locale string, everything is plain JSON (no components).
 */

export interface RawReference {
  label: string
  href: string
}

export interface RawCourse {
  slug: string
  categoryId: string
  subcategoryId: string
  order: number
  locales: string[]
  contentPaths: Record<string, string>
  title: Record<string, string>
  desc: Record<string, string>
  kicker: Record<string, string>
  lead: Record<string, string>
  updated: Record<string, string>
  references: Record<string, RawReference[]>
  upNext: Record<string, { label: string; href: string }> | null
  author: string
  minutes: number
  level: Level
  isNew: boolean
}

export interface RawSubcategory {
  id: string
  order: number
  name: Record<string, string>
  courses: RawCourse[]
}

export interface RawCategory {
  id: string
  order: number
  icon: string
  accent: string
  title: Record<string, string>
  blurb: Record<string, string>
  tags: Record<string, string[]>
  groups: RawSubcategory[]
}

export interface RawCatalog {
  categories: RawCategory[]
}

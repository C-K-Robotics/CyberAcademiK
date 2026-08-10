import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { load as loadYaml } from 'js-yaml'
import type { Plugin } from 'vite'

/**
 * CyberAcademiK content pipeline.
 *
 * Courses are *discovered* from the `content/` directory at build time — nothing
 * is registered in code. The layout is:
 *
 *   content/<category>/<subcategory>/<course>/<locale>.mdx
 *
 * with `_category.json` / `_subcategory.json` sidecars for the taxonomy, and all
 * per-course metadata living in each MDX file's YAML frontmatter.
 *
 * This plugin does two things:
 *  1. Exposes a `virtual:course-catalog` module holding the whole taxonomy plus
 *     every course's parsed frontmatter — light enough for the homepage, while
 *     the heavy MDX bodies stay lazily code-split.
 *  2. Strips the YAML frontmatter from MDX before it is compiled, so the metadata
 *     block never renders as page content.
 */

const VIRTUAL_ID = 'virtual:course-catalog'
const RESOLVED_ID = '\0' + VIRTUAL_ID
// The optional ﻿ matters: editors on Windows routinely save MDX with a
// UTF-8 BOM, and without it the frontmatter would neither be parsed (empty
// catalog metadata) nor stripped (the raw YAML block renders as lesson text).
const FRONTMATTER_RE = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/

type Dict = Record<string, unknown>

interface ScanResult {
  catalog: { categories: unknown[] }
  /** All content MDX paths, e.g. `/content/<…>.mdx`. */
  contentPaths: string[]
}

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

function subdirs(p: string): string[] {
  if (!existsSync(p)) return []
  return readdirSync(p)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => isDir(join(p, name)))
    .sort()
}

function readJson(p: string): Dict {
  return JSON.parse(readFileSync(p, 'utf8')) as Dict
}

function parseFrontmatter(file: string): Dict {
  const raw = readFileSync(file, 'utf8')
  const m = raw.match(FRONTMATTER_RE)
  if (!m) return {}
  const data = loadYaml(m[1])
  return data && typeof data === 'object' ? (data as Dict) : {}
}

/** Build a `{ [locale]: frontmatter[key] }` map across all of a course's locales. */
function pick(m: Record<string, Dict>, key: string): Dict {
  const out: Dict = {}
  for (const [locale, v] of Object.entries(m)) {
    if (v?.[key] !== undefined) out[locale] = v[key]
  }
  return out
}

function num(v: unknown, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function scanContent(contentDir: string): ScanResult {
  const contentPaths: string[] = []
  const categories: unknown[] = []

  for (const categoryDir of subdirs(contentDir)) {
    const categoryPath = join(contentDir, categoryDir)
    const categoryMetaPath = join(categoryPath, '_category.json')
    if (!existsSync(categoryMetaPath)) continue
    const cm = readJson(categoryMetaPath)

    const groups: unknown[] = []
    for (const subDir of subdirs(categoryPath)) {
      const subPath = join(categoryPath, subDir)
      const subMetaPath = join(subPath, '_subcategory.json')
      if (!existsSync(subMetaPath)) continue
      const sm = readJson(subMetaPath)

      const courses: Array<Record<string, unknown>> = []
      for (const slug of subdirs(subPath)) {
        const coursePath = join(subPath, slug)
        const mdxFiles = readdirSync(coursePath).filter((f) => f.endsWith('.mdx'))
        if (mdxFiles.length === 0) continue

        const byFm: Record<string, Dict> = {}
        const localePaths: Record<string, string> = {}
        for (const f of mdxFiles) {
          const locale = f.replace(/\.mdx$/, '')
          const rel = `/content/${categoryDir}/${subDir}/${slug}/${f}`
          contentPaths.push(rel)
          byFm[locale] = parseFrontmatter(join(coursePath, f))
          localePaths[locale] = rel
        }

        const locales = Object.keys(byFm)
        const base = byFm['en'] ?? byFm[locales[0]]

        courses.push({
          slug,
          categoryId: String(cm.id ?? categoryDir),
          subcategoryId: String(sm.id ?? subDir),
          order: num(base.order, 999),
          locales,
          contentPaths: localePaths,
          title: pick(byFm, 'title'),
          desc: pick(byFm, 'desc'),
          kicker: pick(byFm, 'kicker'),
          lead: pick(byFm, 'lead'),
          updated: pick(byFm, 'updated'),
          references: pick(byFm, 'references'),
          upNext: base.upNext ? pick(byFm, 'upNext') : null,
          author: String(base.author ?? ''),
          minutes: num(base.minutes, 0),
          level: String(base.level ?? 'intermediate'),
          isNew: Boolean(base.isNew),
        })
      }

      courses.sort((a, b) => (a.order as number) - (b.order as number))
      groups.push({
        id: String(sm.id ?? subDir),
        order: num(sm.order, 999),
        name: sm.name ?? {},
        courses,
      })
    }

    groups.sort((a, b) => (a as { order: number }).order - (b as { order: number }).order)
    categories.push({
      id: String(cm.id ?? categoryDir),
      order: num(cm.order, 999),
      icon: String(cm.icon ?? ''),
      accent: String(cm.accent ?? '--ac1'),
      title: cm.title ?? {},
      blurb: cm.blurb ?? {},
      tags: cm.tags ?? {},
      groups,
    })
  }

  categories.sort((a, b) => (a as { order: number }).order - (b as { order: number }).order)
  return { catalog: { categories }, contentPaths }
}

export function courseContent(): Plugin {
  let contentDir = join(process.cwd(), 'content')

  return {
    name: 'cyberacademik:course-content',
    enforce: 'pre',

    configResolved(config) {
      contentDir = join(config.root, 'content')
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return
      const { catalog, contentPaths } = scanContent(contentDir)
      return [
        `export const CATALOG = ${JSON.stringify(catalog)}`,
        `export const CONTENT_PATHS = ${JSON.stringify(contentPaths)}`,
        '',
      ].join('\n')
    },

    // Remove the YAML frontmatter block so it is not rendered as lesson content.
    transform(code, id) {
      const path = id.split('?')[0]
      if (!path.endsWith('.mdx')) return null
      if (!FRONTMATTER_RE.test(code)) return null
      return { code: code.replace(FRONTMATTER_RE, ''), map: null }
    },

    // In dev, reflect any content/ change live: re-scan the catalog and reload.
    // We handle `change` too (not just add/unlink) so *editing* an existing MDX
    // frontmatter, lesson body, or a `_category.json`/`_subcategory.json` sidecar
    // updates the page — `addWatchFile` alone doesn't reliably trigger a reload.
    configureServer(server) {
      server.watcher.add(contentDir)
      const root = contentDir.replace(/\\/g, '/')
      const reload = (file: string) => {
        if (!file.replace(/\\/g, '/').startsWith(root)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
      server.watcher.on('change', reload)
    },
  }
}

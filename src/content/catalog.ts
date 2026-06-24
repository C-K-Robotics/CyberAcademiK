/**
 * The course taxonomy is discovered from the content/ directory at build time —
 * there is no hand-maintained catalog. See discovery.ts (and the Vite plugin in
 * vite/course-content.ts) for how categories, sub-categories, and courses are
 * read from content/<category>/<subcategory>/<course>/<locale>.mdx.
 */
export { SUBTEAMS } from './discovery'

/// <reference types="vite/client" />

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  import type { MDXComponents } from 'mdx/types'

  /** The default export of a compiled MDX file: an MDX content component. */
  const MDXContent: ComponentType<{ components?: MDXComponents }>
  export default MDXContent
}

declare module 'virtual:course-catalog' {
  import type { RawCatalog } from './content/raw'

  /** The full course taxonomy + per-course frontmatter, scanned from content/. */
  export const CATALOG: RawCatalog
}

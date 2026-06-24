import type { MDXComponents } from 'mdx/types'
import { proseComponents } from './prose'
import { Section } from './Section'
import { Callout } from './Callout'
import { Quiz, Q, Choice } from './Quiz'
import { CodeTabs, CodeTab } from './CodeTabs'
import { Figure } from './Figure'

/**
 * Components available in *every* course's MDX. Course modules may extend this
 * with their own course-specific components (e.g. simulators).
 */
export const genericMdxComponents: MDXComponents = {
  ...proseComponents,
  Section,
  Callout,
  Quiz,
  Q,
  Choice,
  CodeTabs,
  CodeTab,
  Figure,
}

import type { ReactNode } from 'react'

interface SlideProps {
  children?: ReactNode
  id?: string
}

/**
 * Slide break inside a <Section> that SlideDeck discovers for
 * per-section navigation in slide mode. In normal scroll mode the
 * wrapper is invisible so content layout is unaffected.
 */
export function Slide({ children, id }: SlideProps) {
  return (
    <div
      data-slide={id ?? 'break'}
      style={{ scrollMarginTop: 0 }}
    >
      {children}
    </div>
  )
}
Slide.displayName = 'Slide'

/** One opt-in reveal step. In reading mode this is just an inline wrapper. */
export function Reveal({ children }: { children?: ReactNode }) {
  return <span data-slide-reveal="">{children}</span>
}

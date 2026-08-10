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

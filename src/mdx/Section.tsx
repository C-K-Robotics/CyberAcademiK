import type { ReactNode } from 'react'

const mono = "'IBM Plex Mono', monospace"

interface SectionProps {
  /** Stable id; the DOM id becomes `sec-${id}` and the chip nav links to it. */
  id: string
  /** Display number, e.g. "01". */
  n: string
  /** Section heading. */
  title: string
  /** Short label for the chip nav; defaults to `title`. */
  chip?: string
  children?: ReactNode
}

/**
 * A numbered lesson section. The chip nav (ChipNav.tsx) discovers these at runtime
 * via the `data-section` attribute, so content authors only add <Section> blocks —
 * the navigation builds itself.
 */
export function Section({ id, n, title, chip, children }: SectionProps) {
  return (
    <section
      id={`sec-${id}`}
      data-section={id}
      data-chip={chip ?? title}
      data-n={n}
      style={{ scrollMarginTop: 118, paddingTop: 50 }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
        <span style={{ fontFamily: mono, fontSize: 13, color: 'var(--ac1)' }}>{n}</span>
        <h2 style={{ fontSize: 26, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
      </div>
      {children}
    </section>
  )
}

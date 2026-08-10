import type { ReactNode } from 'react'
import { assetUrl } from '../lib/assetUrl'

interface FigureProps {
  src: string
  alt?: string
  caption?: ReactNode
  /** CSS width for the image, e.g. `'60%'`, `'400px'`. Defaults to full width. */
  width?: string
}

/** A captioned image for lesson content. */
export function Figure({ src, alt = '', caption, width = '100%' }: FigureProps) {
  const full = width === '100%'

  return (
    <figure
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: full ? 'stretch' : 'center',
        margin: '22px 0',
      }}
    >
      <img
        src={assetUrl(src)}
        alt={alt}
        style={{
          width,
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: 12,
          border: '1px solid var(--line)',
        }}
      />
      {caption && (
        <figcaption
          style={{
            fontFamily: "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace",
            fontSize: 11.5,
            color: 'var(--tx-4)',
            marginTop: 9,
            textAlign: 'center',
            padding: '0 24px',
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

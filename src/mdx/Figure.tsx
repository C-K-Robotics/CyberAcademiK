import type { ReactNode } from 'react'

interface FigureProps {
  src: string
  alt?: string
  caption?: ReactNode
}

/** A captioned image for lesson content. */
export function Figure({ src, alt = '', caption }: FigureProps) {
  return (
    <figure style={{ margin: '22px 0' }}>
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          display: 'block',
          borderRadius: 12,
          border: '1px solid var(--line)',
        }}
      />
      {caption && (
        <figcaption
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11.5,
            color: 'var(--tx-4)',
            marginTop: 9,
            textAlign: 'center',
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

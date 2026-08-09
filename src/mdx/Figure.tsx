import type { ReactNode } from 'react'

interface FigureProps {
  src: string
  alt?: string
  caption?: ReactNode
  width?: string // e.g. '60%' '400px' '100%'
}

/** A captioned image for lesson content. */
export function Figure({ src, alt = '', caption, width = '100%' }: FigureProps) {
  const base = import.meta.env.BASE_URL || location.pathname.replace(/\/[^/]*$/, '')
  const relativeSrc = src.startsWith('/') ? src.slice(1) : src
  const fullSrc = base.endsWith('/') ? `${base}${relativeSrc}` : `${base}/${relativeSrc}`

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: width === '100%' ? 'stretch' : 'center',
        margin: '22px 0',
      }}
    >
      <img
        src={fullSrc}
        alt={alt}
        style={{
          width,
          maxWidth: width === '100%' ? undefined : `100%`,
          height: 'auto',
          display: 'block',
          borderRadius: 12,
          border: '1px solid var(--line)',
        }}
      />
      {caption && (
        <div
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
        </div>
      )}
    </div>
  )
}

import type { CSSProperties } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import { courseCountForSubteam } from '../../content/selectors'
import { pad2 } from '../../i18n/format'
import type { Subteam } from '../../content/types'

const mono = "'IBM Plex Mono', monospace"

interface CategoryCardProps {
  subteam: Subteam
  index: number
  onClick: () => void
}

export function CategoryCard({ subteam, index, onClick }: CategoryCardProps) {
  const { t, locale } = useI18n()
  const Icon = subteam.icon
  const count = courseCountForSubteam(subteam)
  const accentStyle = {
    '--accent': `var(${subteam.accent})`,
    '--accent-rgb': `var(${subteam.accentRgb})`,
  } as CSSProperties

  return (
    <button type="button" className="hm-cat-card" style={accentStyle} onClick={onClick}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 22,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            background: 'rgba(var(--accent-rgb),0.12)',
            border: '1px solid rgba(var(--accent-rgb),0.4)',
          }}
        >
          <Icon size={22} />
        </div>
        <span style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--tx-5)' }}>
          {pad2(index + 1)}
        </span>
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          marginBottom: 8,
          lineHeight: 1.15,
        }}
      >
        {subteam.title[locale]}
      </div>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--tx-2b)', margin: '0 0 22px' }}>
        {subteam.blurb[locale]}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
        {subteam.tags[locale].map((tag) => (
          <span
            key={tag}
            style={{
              fontFamily: mono,
              fontSize: 10.5,
              color: 'var(--tx-3)',
              padding: '3px 9px',
              borderRadius: 20,
              border: '1px solid var(--line)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 16,
          borderTop: '1px solid var(--line)',
          marginTop: 'auto',
        }}
      >
        <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--tx-4)' }}>
          {t.courseCountLabel(count)} · {t.groupsCount(subteam.groups.length)}
        </span>
        <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
          Browse →
        </span>
      </div>
    </button>
  )
}

import { ArrowRight, ExternalLink } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import type { CourseMeta } from '../../content/types'

const mono = "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace"

/** The end-of-lesson block: an "up next" card and the references list (from meta). */
export function CourseFooterNav({ meta }: { meta: CourseMeta }) {
  const { t, locale } = useI18n()
  const upNext = meta.upNext?.[locale]
  const references = meta.references[locale]
  return (
    <div
      className="course-grid-2"
      style={{
        marginTop: 40,
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: 18,
        alignItems: 'stretch',
      }}
    >
      {upNext ? (
        <div
          style={{
            background: 'linear-gradient(135deg, var(--bg-accent), var(--bg-block))',
            border: '1px solid rgba(var(--ac1-rgb),0.3)',
            borderRadius: 14,
            padding: '22px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ac1b)', marginBottom: 6 }}>
              {t.upNext('')}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--tx-strong)' }}>
              {upNext.label}
            </div>
          </div>
          <ArrowRight size={24} color="var(--ac1)" />
        </div>
      ) : (
        <div />
      )}

      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '18px 20px',
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.12em', color: 'var(--tx-5)', marginBottom: 11 }}>
          {t.references}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
          {references.map((ref) => (
            <a
              key={ref.href}
              href={ref.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', gap: 7, alignItems: 'center', color: 'var(--ac1b)' }}
            >
              <ExternalLink size={13} color="var(--tx-5)" style={{ flex: 'none' }} />
              {ref.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

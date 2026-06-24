import { Clock, RefreshCw, SignalHigh, User } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import { formatMinutes, pad2 } from '../../i18n/format'
import { getLessonPosition } from '../../content/selectors'
import type { CourseMeta } from '../../content/types'

const mono = "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace"

function levelLabel(level: CourseMeta['level'], t: ReturnType<typeof useI18n>['t']): string {
  return level === 'beginner'
    ? t.levelBeginner
    : level === 'advanced'
      ? t.levelAdvanced
      : t.levelIntermediate
}

const metaItem = { display: 'flex', alignItems: 'center', gap: 7 } as const

export function LessonHeader({ meta }: { meta: CourseMeta }) {
  const { t, locale } = useI18n()
  // The lesson counter ("LESSON 03 / 05") is derived from the course's position
  // in its module, not authored — the kicker frontmatter holds only the label.
  const pos = getLessonPosition(meta.slug)
  const eyebrow = [
    meta.kicker[locale],
    pos && t.lessonCounter(pad2(pos.number), pad2(pos.total)),
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 11.5, letterSpacing: '0.14em', color: 'var(--ac1)', marginBottom: 14 }}>
        {eyebrow}
      </div>
      <h1
        className="course-h1"
        style={{ fontSize: 44, lineHeight: 1.05, fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em' }}
      >
        {meta.title[locale]}
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--tx-2)', maxWidth: 680, margin: '0 0 22px' }}>
        {meta.lead[locale]}
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 18,
          fontFamily: mono,
          fontSize: 11.5,
          color: 'var(--tx-3)',
          paddingBottom: 30,
          borderBottom: '1px solid var(--line)',
        }}
      >
        <span style={metaItem}>
          <User size={13} color="var(--ac1)" /> {meta.author}
        </span>
        <span style={metaItem}>
          <Clock size={13} color="var(--tx-5)" /> {formatMinutes(meta.minutes, locale)}
        </span>
        <span style={metaItem}>
          <SignalHigh size={13} color="var(--tx-5)" /> {levelLabel(meta.level, t)}
        </span>
        <span style={metaItem}>
          <RefreshCw size={12} color="var(--tx-5)" /> {meta.updated[locale]}
        </span>
      </div>
    </div>
  )
}

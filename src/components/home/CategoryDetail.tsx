import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nProvider'
import { isCourseAvailable } from '../../content/selectors'
import { formatMinutes, pad2 } from '../../i18n/format'
import type { CourseEntry, Subteam } from '../../content/types'

const mono = "'IBM Plex Mono', monospace"

interface CategoryDetailProps {
  subteam: Subteam
  onHome: () => void
}

function levelLabel(level: CourseEntry['level'], t: ReturnType<typeof useI18n>['t']): string {
  return level === 'beginner'
    ? t.levelBeginner
    : level === 'advanced'
      ? t.levelAdvanced
      : t.levelIntermediate
}

function CourseCard({
  course,
  index,
  accent,
  accentRgb,
}: {
  course: CourseEntry
  index: number
  accent: string
  accentRgb: string
}) {
  const { t, locale } = useI18n()
  const available = isCourseAvailable(course)
  const accentStyle = {
    '--accent': `var(${accent})`,
    '--accent-rgb': `var(${accentRgb})`,
  } as CSSProperties

  const inner = (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
      <span
        style={{
          fontFamily: mono,
          fontSize: 12,
          color: 'var(--accent)',
          flex: 'none',
          paddingTop: 2,
          fontWeight: 600,
        }}
      >
        {pad2(index + 1)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            marginBottom: 6,
            lineHeight: 1.25,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--tx-strong)', lineHeight: 1.25 }}>
            {course.title[locale]}
          </span>
          {course.isNew && (
            <span
              style={{
                fontFamily: mono,
                fontSize: 9,
                letterSpacing: '0.05em',
                color: 'var(--red)',
                border: '1px solid rgba(var(--red-rgb),0.5)',
                borderRadius: 4,
                padding: '1px 5px',
              }}
            >
              {t.badgeNew}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--tx-2b)', margin: '0 0 9px' }}>
          {course.desc[locale]}
        </p>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontFamily: mono, fontSize: 10.5, color: 'var(--tx-4)' }}>
          <span>{levelLabel(course.level, t)}</span>
          <span>◷ {formatMinutes(course.minutes, locale)}</span>
          {!available && (
            <span style={{ marginLeft: 'auto', color: 'var(--tx-5)' }}>{t.comingSoon}</span>
          )}
        </div>
      </div>
    </div>
  )

  if (available) {
    return (
      <Link to={`/courses/${course.slug}`} className="hm-course-card" data-available="true" style={accentStyle}>
        {inner}
      </Link>
    )
  }
  return (
    <div className="hm-course-card" data-available="false" style={accentStyle} aria-disabled="true">
      {inner}
    </div>
  )
}

export function CategoryDetail({ subteam, onHome }: CategoryDetailProps) {
  const { t, locale } = useI18n()
  const Icon = subteam.icon
  const accentStyle = {
    '--accent': `var(${subteam.accent})`,
    '--accent-rgb': `var(${subteam.accentRgb})`,
  } as CSSProperties

  return (
    <div className="hm-cat-wrap" style={accentStyle}>
      {/* breadcrumb */}
      <div
        style={{
          fontFamily: mono,
          fontSize: 11.5,
          color: 'var(--tx-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          marginBottom: 30,
        }}
      >
        <button
          type="button"
          onClick={onHome}
          style={{ color: 'var(--tx-3)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}
        >
          {t.library}
        </button>
        <span style={{ color: 'var(--tx-faint)' }}>/</span>
        <span style={{ color: 'var(--tx-1)' }}>{subteam.title[locale]}</span>
      </div>

      {/* header */}
      <div className="hm-cathead" style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 42 }}>
        <div
          style={{
            width: 58,
            height: 58,
            flex: 'none',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            background: 'rgba(var(--accent-rgb),0.12)',
            border: '1px solid rgba(var(--accent-rgb),0.4)',
          }}
        >
          <Icon size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 38, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
            {subteam.title[locale]}
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--tx-2)', margin: 0, maxWidth: 660 }}>
            {subteam.blurb[locale]}
          </p>
        </div>
      </div>

      {/* groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 38 }}>
        {subteam.groups.map((group) => (
          <section key={group.id}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  flex: 'none',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 8px rgba(var(--accent-rgb),0.6)',
                }}
              />
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
                {group.name[locale]}
              </h2>
              <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--tx-4)' }}>
                {t.coursesCount(group.courses.length)}
              </span>
            </div>
            {group.courses.length > 0 ? (
              <div className="hm-subgrid">
                {group.courses.map((course, ci) => (
                  <CourseCard
                    key={course.slug}
                    course={course}
                    index={ci}
                    accent={subteam.accent}
                    accentRgb={subteam.accentRgb}
                  />
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: mono, fontSize: 12, color: 'var(--tx-5)', padding: '2px 2px 4px' }}>
                {t.comingSoon}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

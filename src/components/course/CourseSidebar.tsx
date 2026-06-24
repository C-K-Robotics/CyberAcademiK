import { Link } from 'react-router-dom'
import { BrandLogo } from '../layout/BrandLogo'
import { useI18n } from '../../i18n/I18nProvider'
import { getSubteam } from '../../content/selectors'
import type { CourseEntry, CourseMeta } from '../../content/types'
import type { Locale } from '../../i18n/strings'

const mono = "'IBM Plex Mono', monospace"

/** Filled dot for the lesson you're on, hollow ring for the rest. */
function LessonBullet({ current }: { current: boolean }) {
  return (
    <span
      style={{
        width: 15,
        height: 15,
        flex: 'none',
        borderRadius: '50%',
        border: current ? '1.5px solid var(--ac1)' : '1.5px solid var(--tx-faint)',
        background: current
          ? 'radial-gradient(circle, var(--ac1) 0 38%, transparent 42%)'
          : 'transparent',
      }}
    />
  )
}

function LessonRow({
  course,
  current,
  locale,
  onNavigate,
}: {
  course: CourseEntry
  current: boolean
  locale: Locale
  onNavigate?: () => void
}) {
  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: current ? '8px 10px 8px 16px' : '7px 10px 7px 18px',
    fontSize: 12.5,
    color: current ? 'var(--tx-strong)' : 'var(--tx-3)',
    fontWeight: current ? 500 : 400,
    background: current ? 'rgba(var(--ac1-rgb),0.08)' : 'transparent',
    borderLeft: current ? '2px solid var(--ac1)' : '2px solid transparent',
    borderRadius: current ? '0 7px 7px 0' : 0,
    textDecoration: 'none',
  } as const

  const body = (
    <>
      <LessonBullet current={current} />
      {course.title[locale]}
    </>
  )

  if (current) {
    return (
      <div style={style} aria-current="page">
        {body}
      </div>
    )
  }
  return (
    <Link to={`/courses/${course.slug}`} onClick={onNavigate} style={style}>
      {body}
    </Link>
  )
}

/**
 * Course navigation, derived live from the discovered catalog: the current
 * course's subteam, its sub-categories as modules, and the real courses inside
 * them as lessons. Nothing is hand-authored — it always reflects content/.
 */
export function CourseSidebar({ meta, onHome }: { meta: CourseMeta; onHome?: () => void }) {
  const { t, locale } = useI18n()
  const subteam = getSubteam(meta.subteamId)

  return (
    <>
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Link to="/" onClick={onHome} aria-label="CyberAcademiK home">
          <BrandLogo height={44} />
        </Link>
      </div>

      <nav style={{ padding: '14px 12px', flex: 1 }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 10,
            letterSpacing: '0.16em',
            color: 'var(--tx-5)',
            padding: '6px 10px 10px',
          }}
        >
          {subteam ? subteam.title[locale] : t.myCourses}
        </div>

        {subteam?.groups.map((group) => {
          const isCurrentModule = group.courses.some((c) => c.slug === meta.slug)
          return (
            <div key={group.id}>
              <div
                style={{
                  padding: '7px 10px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: isCurrentModule ? 'var(--tx-bright)' : 'var(--tx-2c)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {group.name[locale]}
                {isCurrentModule && (
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 9,
                      color: 'var(--ac1)',
                      border: '1px solid rgba(var(--ac1-rgb),0.4)',
                      borderRadius: 4,
                      padding: '1px 5px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {t.now}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, margin: '2px 0 12px' }}>
                {group.courses.length === 0 ? (
                  <div
                    style={{
                      padding: '6px 10px 6px 18px',
                      fontFamily: mono,
                      fontSize: 11,
                      color: 'var(--tx-5)',
                    }}
                  >
                    {t.comingSoon}
                  </div>
                ) : (
                  group.courses.map((course) => (
                    <LessonRow
                      key={course.slug}
                      course={course}
                      current={course.slug === meta.slug}
                      locale={locale}
                      onNavigate={onHome}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </nav>
    </>
  )
}

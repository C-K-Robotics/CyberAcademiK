import { Link } from 'react-router-dom'
import { Menu, Monitor, MonitorOff } from 'lucide-react'
import { ThemeToggle } from '../layout/ThemeToggle'
import { LanguageSwitcher } from '../layout/LanguageSwitcher'
import { CourseSearch } from '../search/CourseSearch'
import { useI18n } from '../../i18n/I18nProvider'
import type { CourseMeta } from '../../content/types'
import type { Subteam } from '../../content/types'

const mono = "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace"

interface CourseTopbarProps {
  meta: CourseMeta
  subteam?: Subteam
  onToggleNav: () => void
  slideMode: boolean
  onToggleSlide: () => void
}

export function CourseTopbar({ meta, subteam, onToggleNav, slideMode, onToggleSlide }: CourseTopbarProps) {
  const { t, locale } = useI18n()
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'var(--bg-topbar)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 28px',
      }}
    >
      <button type="button" className="course-hamburger" onClick={onToggleNav} title={t.menu} aria-label={t.menu}>
        <Menu size={17} />
      </button>

      <div
        className="course-breadcrumb"
        style={{ fontFamily: mono, fontSize: 11.5, color: 'var(--tx-3)', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <Link to="/" style={{ color: 'var(--tx-3)' }}>
          {t.library}
        </Link>
        {subteam && (
          <>
            <span style={{ color: 'var(--tx-faint)' }}>/</span>
            <Link to={`/subteams/${subteam.id}`} style={{ color: 'var(--tx-3)' }}>
              {subteam.title[locale]}
            </Link>
          </>
        )}
        <span style={{ color: 'var(--tx-faint)' }}>/</span>
        <span style={{ color: 'var(--tx-1)' }}>{meta.title[locale]}</span>
      </div>

      <div style={{ flex: 1 }} />

      <CourseSearch variant="course" />

      <button
        type="button"
        className="course-slide-toggle"
        onClick={onToggleSlide}
        title={slideMode ? t.slideExit : t.slideMode}
        aria-label={slideMode ? t.slideExit : t.slideMode}
        aria-pressed={slideMode}
      >
        {slideMode ? <MonitorOff size={16} /> : <Monitor size={16} />}
      </button>

      <LanguageSwitcher />
      <ThemeToggle />
    </header>
  )
}

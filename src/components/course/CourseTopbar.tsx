import { Link } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { ThemeToggle } from '../layout/ThemeToggle'
import { LanguageSwitcher } from '../layout/LanguageSwitcher'
import { useI18n } from '../../i18n/I18nProvider'
import type { CourseMeta } from '../../content/types'
import type { Subteam } from '../../content/types'

const mono = "'IBM Plex Mono', monospace"

interface CourseTopbarProps {
  meta: CourseMeta
  subteam?: Subteam
  onToggleNav: () => void
}

export function CourseTopbar({ meta, subteam, onToggleNav }: CourseTopbarProps) {
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
            <span>{subteam.title[locale]}</span>
          </>
        )}
        <span style={{ color: 'var(--tx-faint)' }}>/</span>
        <span style={{ color: 'var(--tx-1)' }}>{meta.title[locale]}</span>
      </div>

      <div style={{ flex: 1 }} />

      <label
        className="course-search"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-input)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          padding: '7px 11px',
          width: 200,
        }}
      >
        <Search size={14} color="var(--tx-4)" style={{ flex: 'none' }} />
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            flex: 1,
            minWidth: 0,
            fontSize: 12.5,
            color: 'var(--tx-bright)',
            fontFamily: mono,
          }}
        />
      </label>

      <LanguageSwitcher />
      <ThemeToggle />
    </header>
  )
}

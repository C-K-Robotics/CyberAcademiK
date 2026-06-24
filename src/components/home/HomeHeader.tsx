import { type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BrandLogo } from '../layout/BrandLogo'
import { ThemeToggle } from '../layout/ThemeToggle'
import { LanguageSwitcher } from '../layout/LanguageSwitcher'
import { CourseSearch } from '../search/CourseSearch'
import { useI18n } from '../../i18n/I18nProvider'
import { SUBTEAMS } from '../../content/catalog'
import type { Subteam } from '../../content/types'

/** Short nav label: drop the verbose suffixes used in full subteam titles. */
function navLabel(subteam: Subteam, locale: 'en' | 'zh-Hant'): string {
  if (locale === 'zh-Hant') return subteam.title['zh-Hant']
  return subteam.title.en.replace(' Engineering', '').replace(' × Programming', ' × Prog')
}

export function HomeHeader() {
  const { locale } = useI18n()
  const { id: activeSubteamId } = useParams<{ id: string }>()

  return (
    <header className="hm-topbar">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', flex: 'none' }}>
        <BrandLogo height={36} />
      </Link>
      <nav className="hm-topnav">
        {SUBTEAMS.map((subteam) => (
          <Link
            key={subteam.id}
            to={`/subteams/${subteam.id}`}
            className="hm-navlink"
            data-active={activeSubteamId === subteam.id}
            style={
              {
                '--accent': `var(${subteam.accent})`,
                '--accent-rgb': `var(${subteam.accentRgb})`,
              } as CSSProperties
            }
          >
            {navLabel(subteam, locale)}
          </Link>
        ))}
      </nav>
      <div style={{ flex: 1 }} />
      <CourseSearch variant="home" />
      <LanguageSwitcher />
      <ThemeToggle />
    </header>
  )
}

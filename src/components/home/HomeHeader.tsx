import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { BrandLogo } from '../layout/BrandLogo'
import { ThemeToggle } from '../layout/ThemeToggle'
import { LanguageSwitcher } from '../layout/LanguageSwitcher'
import { useI18n } from '../../i18n/I18nProvider'
import { SUBTEAMS } from '../../content/catalog'
import type { Subteam } from '../../content/types'

interface HomeHeaderProps {
  activeSubteamId: string | null
  onSelectSubteam: (id: string) => void
  onHome: () => void
  query: string
  onQuery: (q: string) => void
}

/** Short nav label: drop the verbose suffixes used in full subteam titles. */
function navLabel(subteam: Subteam, locale: 'en' | 'zh-Hant'): string {
  if (locale === 'zh-Hant') return subteam.title['zh-Hant']
  return subteam.title.en.replace(' Engineering', '').replace(' × Programming', ' × Prog')
}

export function HomeHeader({
  activeSubteamId,
  onSelectSubteam,
  onHome,
  query,
  onQuery,
}: HomeHeaderProps) {
  const { t, locale } = useI18n()
  return (
    <header className="hm-topbar">
      <Link to="/" onClick={onHome} style={{ display: 'flex', alignItems: 'center', flex: 'none' }}>
        <BrandLogo height={36} />
      </Link>
      <nav className="hm-topnav">
        {SUBTEAMS.map((subteam) => (
          <button
            key={subteam.id}
            type="button"
            className="hm-navlink"
            data-active={activeSubteamId === subteam.id}
            style={
              {
                '--accent': `var(${subteam.accent})`,
                '--accent-rgb': `var(${subteam.accentRgb})`,
              } as CSSProperties
            }
            onClick={() => onSelectSubteam(subteam.id)}
          >
            {navLabel(subteam, locale)}
          </button>
        ))}
      </nav>
      <div style={{ flex: 1 }} />
      <label className="hm-search">
        <Search size={14} color="var(--tx-4)" style={{ flex: 'none' }} />
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </label>
      <LanguageSwitcher />
      <ThemeToggle />
    </header>
  )
}

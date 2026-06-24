import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../theme/ThemeProvider'
import { useI18n } from '../../i18n/I18nProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useI18n()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={t.toggleTheme}
      aria-label={t.toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        color: 'var(--tx-2)',
        border: 'none',
        padding: 6,
        borderRadius: 8,
        cursor: 'pointer',
        lineHeight: 1,
      }}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}

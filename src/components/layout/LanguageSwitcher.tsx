import { useI18n } from '../../i18n/I18nProvider'
import { LOCALES, LOCALE_LABELS, LOCALE_NAMES } from '../../i18n/strings'

/** Compact segmented control for switching UI + content language. */
export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  return (
    <div
      role="group"
      aria-label="Language"
      style={{
        display: 'flex',
        gap: 2,
        padding: 2,
        background: 'var(--bg-input)',
        border: '1px solid var(--line)',
        borderRadius: 8,
      }}
    >
      {LOCALES.map((loc) => {
        const active = loc === locale
        return (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            title={LOCALE_NAMES[loc]}
            aria-pressed={active}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 9px',
              borderRadius: 6,
              cursor: 'pointer',
              border: 'none',
              background: active ? 'rgba(var(--ac1-rgb),0.16)' : 'transparent',
              color: active ? 'var(--ac1)' : 'var(--tx-3)',
              transition: 'all .15s',
            }}
          >
            {LOCALE_LABELS[loc]}
          </button>
        )
      })}
    </div>
  )
}

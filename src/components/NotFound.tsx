import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { Logo } from './layout/Logo'

export function NotFound() {
  const { t } = useI18n()
  return (
    <div
      className="app-grid"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <Logo size={40} />
      <h1 style={{ fontSize: 30, fontWeight: 700, margin: '12px 0 0' }}>{t.notFoundTitle}</h1>
      <p style={{ color: 'var(--tx-2)', margin: 0 }}>{t.notFoundBody}</p>
      <Link
        to="/"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13,
          color: 'var(--ac1)',
          border: '1px solid rgba(var(--ac1-rgb),0.45)',
          background: 'rgba(var(--ac1-rgb),0.08)',
          padding: '9px 16px',
          borderRadius: 9,
        }}
      >
        ← {t.backToLibrary}
      </Link>
    </div>
  )
}

import { useI18n } from '../../i18n/I18nProvider'

const mono = "'IBM Plex Mono', monospace"

export function Footer() {
  const { t } = useI18n()
  return (
    <footer
      style={{
        borderTop: '1px solid var(--line)',
        padding: '26px 32px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: 'var(--tx-2b)' }}>
          {t.footerContentBy}
        </span>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: 'var(--tx-2b)' }}>
          {t.footerSiteBy}
        </span>
        <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--tx-4)', marginTop: 4 }}>
          {t.footerCopyright}
        </span>
      </div>
      <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--tx-faint)' }}>
        {t.footerDisciplines}
      </span>
    </footer>
  )
}

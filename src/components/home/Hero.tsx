import { useI18n } from '../../i18n/I18nProvider'
import { TOTAL_COURSES, TOTAL_SUBTEAMS } from '../../content/selectors'

const mono = "'IBM Plex Mono', monospace"

export function Hero() {
  const { t } = useI18n()
  return (
    <>
      <div className="hm-hero" style={{ maxWidth: 760, marginBottom: 54 }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 11.5,
            letterSpacing: '0.16em',
            color: 'var(--red)',
            marginBottom: 18,
          }}
        >
          {t.heroKicker}
        </div>
        <h1
          style={{
            fontSize: 52,
            lineHeight: 1.04,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            margin: '0 0 20px',
          }}
        >
          {t.heroTitle}
        </h1>
        <p
          style={{
            fontSize: 17.5,
            lineHeight: 1.6,
            color: 'var(--tx-2)',
            margin: 0,
            maxWidth: 600,
          }}
        >
          {t.heroLead}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.14em', color: 'var(--tx-5)' }}>
          {t.browseSubteams}
        </div>
        <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--tx-4)' }}>
          {t.coursesSubteamsMeta(TOTAL_COURSES, TOTAL_SUBTEAMS)}
        </div>
      </div>
    </>
  )
}

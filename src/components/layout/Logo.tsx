interface LogoProps {
  /** Height of the mark in px; the wordmark scales with it. */
  size?: number
  /** Hide the wordmark, showing only the mark (useful in tight spaces). */
  markOnly?: boolean
}

/**
 * The CyberAcademiK wordmark: a small "step response" blueprint mark plus the
 * product name, with the trailing K accented. Pure CSS/SVG so it stays crisp in
 * both themes and never ships a logo that says the wrong name.
 */
export function Logo({ size = 30, markOnly = false }: LogoProps) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{ flex: 'none', display: 'block' }}
      >
        <rect width="100" height="100" rx="22" fill="var(--bg-block)" stroke="var(--line)" />
        <path
          d="M28 70 C 44 70, 44 30, 70 30"
          fill="none"
          stroke="var(--ac1)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line x1="28" y1="30" x2="28" y2="70" stroke="var(--tx-5)" strokeWidth="5" strokeLinecap="round" />
        <line x1="28" y1="70" x2="72" y2="70" stroke="var(--tx-5)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="70" cy="30" r="5.5" fill="var(--ac1b)" />
      </svg>
      {!markOnly && (
        <span
          style={{
            fontWeight: 700,
            fontSize: size * 0.62,
            letterSpacing: '-0.02em',
            color: 'var(--tx-strong)',
            whiteSpace: 'nowrap',
          }}
        >
          CyberAcademi<span style={{ color: 'var(--ac1)' }}>K</span>
        </span>
      )}
    </span>
  )
}

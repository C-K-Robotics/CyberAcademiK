const MONO = "'IBM Plex Mono', monospace"

export function ThreeTerms() {
  return (
    <>
      {/* equation */}
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid rgba(86,130,170,0.16)',
          borderRadius: 14,
          padding: 26,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
          fontFamily: MONO,
          fontSize: 21,
          color: 'var(--tx-strong)',
        }}
      >
        <span style={{ fontStyle: 'italic' }}>u(t)</span>
        <span style={{ color: 'var(--tx-5)' }}>=</span>
        <span style={{ color: 'var(--ac1)' }}>
          K<sub style={{ fontSize: '0.6em' }}>p</sub>
        </span>
        <span style={{ color: 'var(--tx-2b)' }}>·e(t)</span>
        <span style={{ color: 'var(--tx-5)' }}>+</span>
        <span style={{ color: 'var(--ac2)' }}>
          K<sub style={{ fontSize: '0.6em' }}>i</sub>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ fontSize: 34, color: 'var(--ac2)', lineHeight: 0.7 }}>∫</span>
          <span
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              fontSize: 9,
              color: 'var(--tx-3)',
              lineHeight: 1.1,
            }}
          >
            <span>t</span>
            <span>0</span>
          </span>
        </span>
        <span style={{ color: 'var(--tx-2b)' }}>e(τ)dτ</span>
        <span style={{ color: 'var(--tx-5)' }}>+</span>
        <span style={{ color: 'var(--ac3)' }}>
          K<sub style={{ fontSize: '0.6em' }}>d</sub>
        </span>
        <span
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            lineHeight: 1,
            fontSize: 14,
          }}
        >
          <span style={{ color: 'var(--ac3)' }}>d</span>
          <span style={{ borderTop: '1px solid var(--ac3)', paddingTop: 1, color: 'var(--ac3)' }}>
            dt
          </span>
        </span>
        <span style={{ color: 'var(--tx-2b)' }}>e(t)</span>
      </div>

      {/* P / I / D cards */}
      <div
        data-collapse-grid
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}
      >
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid rgba(var(--ac1-rgb),0.3)',
            borderTop: '2px solid var(--ac1)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: 'var(--ac1)',
                fontFamily: MONO,
              }}
            >
              P
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: 'var(--tx-3)',
                textAlign: 'right',
              }}
            >
              the
              <br />
              PRESENT
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Proportional</div>
          <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--tx-2b)', margin: 0 }}>
            Output ∝ the current error. Strong and immediate — but a non-zero error is needed to keep
            pushing, so it leaves a <strong style={{ color: 'var(--tx-1)' }}>steady-state offset</strong>.
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid rgba(var(--ac2-rgb),0.3)',
            borderTop: '2px solid var(--ac2)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: 'var(--ac2)',
                fontFamily: MONO,
              }}
            >
              I
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: 'var(--tx-3)',
                textAlign: 'right',
              }}
            >
              the
              <br />
              PAST
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Integral</div>
          <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--tx-2b)', margin: 0 }}>
            Accumulates error over time. It keeps pushing until the error is truly zero,{' '}
            <strong style={{ color: 'var(--tx-1)' }}>eliminating the offset</strong> P leaves behind.
            Too much causes instability.
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid rgba(var(--ac3-rgb),0.3)',
            borderTop: '2px solid var(--ac3)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: 'var(--ac3)',
                fontFamily: MONO,
              }}
            >
              D
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: 'var(--tx-3)',
                textAlign: 'right',
              }}
            >
              the
              <br />
              FUTURE
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Derivative</div>
          <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--tx-2b)', margin: 0 }}>
            Reacts to the error's rate of change — a brake that{' '}
            <strong style={{ color: 'var(--tx-1)' }}>damps overshoot</strong> and smooths the approach.
            Sensitive to sensor noise.
          </p>
        </div>
      </div>
    </>
  )
}

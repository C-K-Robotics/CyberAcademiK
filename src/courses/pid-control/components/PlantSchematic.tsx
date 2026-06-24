import { useEffect, useRef } from 'react'

// Balanced plant params (mirrors plantParams() default in the design).
const PLANT = { M: 1, mu: 6, K: 20 }

// Builds a stretchable spring polyline from the wall anchor to a moving right end.
// Ported verbatim from the design's springPath().
function springPath(x2: number): string {
  const x1 = 34
  const y = 66
  const lead = 14
  const coils = 6
  const amp = 12
  const z1 = x1 + lead
  const z2 = x2 - lead
  const w = z2 - z1
  const p: string[] = [x1 + ',' + y, z1.toFixed(1) + ',' + y]
  for (let i = 0; i < coils; i++) {
    const xa = z1 + (w * (i + 0.5)) / coils
    p.push(xa.toFixed(1) + ',' + (y + (i % 2 ? amp : -amp)))
  }
  p.push(z2.toFixed(1) + ',' + y, x2.toFixed(1) + ',' + y)
  return p.join(' ')
}

export function PlantSchematic() {
  const massRef = useRef<SVGGElement>(null)
  const springRef = useRef<SVGPolylineElement>(null)
  const damperRodRef = useRef<SVGGElement>(null)
  const markerRef = useRef<SVGGElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const pluck = () => {
    const el = massRef.current
    if (!el) return
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    const { M, mu, K } = PLANT
    const amp = 34
    const dt = 0.016

    const apply = (dx: number) => {
      el.setAttribute('transform', 'translate(' + dx.toFixed(2) + ',0)')
      if (springRef.current) springRef.current.setAttribute('points', springPath(176 + dx))
      if (damperRodRef.current)
        damperRodRef.current.setAttribute('transform', 'translate(' + dx.toFixed(2) + ',0)')
      if (markerRef.current)
        markerRef.current.setAttribute('transform', 'translate(' + dx.toFixed(2) + ',0)')
    }

    // Phase 2: release — spring/damper dynamics from rest at full displacement.
    const release = () => {
      let x = 1
      let v = 0
      let t = 0
      const step = () => {
        const a = (-mu * v - K * x) / M
        v += a * dt
        x += v * dt
        t += dt
        apply(x * amp)
        if (t < 6 && (Math.abs(x) > 0.002 || Math.abs(v) > 0.01)) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          apply(0)
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    // Phase 1: gradually pull the mass outward to full displacement.
    const pullDur = 0.55 // seconds
    let pt = 0
    const pull = () => {
      pt += dt
      const k = Math.min(1, pt / pullDur)
      const eased = 1 - Math.pow(1 - k, 3) // ease-out
      apply(eased * amp)
      if (k < 1) {
        rafRef.current = requestAnimationFrame(pull)
      } else {
        release()
      }
    }

    rafRef.current = requestAnimationFrame(pull)
  }

  return (
    <div
      className="dc-grid2"
      data-collapse-grid
      style={{
        display: 'grid',
        gridTemplateColumns: '1.15fr 1fr',
        gap: 18,
        alignItems: 'stretch',
      }}
    >
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid rgba(86,130,170,0.16)',
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            color: 'var(--tx-5)',
            marginBottom: 6,
          }}
        >
          PLANT SCHEMATIC
        </div>
        <svg viewBox="0 0 420 180" style={{ width: '100%', height: 'auto', flex: 1 }}>
          <defs>
            <marker
              id="ah"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--ac4)" />
            </marker>
          </defs>
          {/* wall */}
          <rect x="20" y="36" width="14" height="108" fill="var(--bg-block)" stroke="#54677b" strokeWidth="1.4" />
          <line x1="20" y1="40" x2="10" y2="50" stroke="var(--tx-faint)" strokeWidth="1.2" />
          <line x1="20" y1="58" x2="10" y2="68" stroke="var(--tx-faint)" strokeWidth="1.2" />
          <line x1="20" y1="76" x2="10" y2="86" stroke="var(--tx-faint)" strokeWidth="1.2" />
          <line x1="20" y1="94" x2="10" y2="104" stroke="var(--tx-faint)" strokeWidth="1.2" />
          <line x1="20" y1="112" x2="10" y2="122" stroke="var(--tx-faint)" strokeWidth="1.2" />
          <line x1="20" y1="130" x2="10" y2="140" stroke="var(--tx-faint)" strokeWidth="1.2" />
          {/* spring (top) */}
          <polyline
            ref={springRef}
            points="34,66 48,66 57.5,54 76.5,78 95.5,54 114.5,78 133.5,54 152.5,78 162,66 176,66"
            fill="none"
            stroke="var(--ac2)"
            strokeWidth="1.8"
          />
          <text
            x="92"
            y="46"
            textAnchor="middle"
            fontFamily="'IBM Plex Mono', monospace"
            fontSize="11"
            fill="var(--ac2)"
          >
            K
          </text>
          {/* damper (bottom): fixed cylinder + piston that slides inside it */}
          <line x1="34" y1="114" x2="70" y2="114" stroke="var(--ac3)" strokeWidth="1.8" />
          <rect x="70" y="102" width="78" height="24" fill="none" stroke="var(--ac3)" strokeWidth="1.8" />
          <g ref={damperRodRef}>
            <line x1="108" y1="105" x2="108" y2="123" stroke="var(--ac3)" strokeWidth="3" />
            <line x1="108" y1="114" x2="176" y2="114" stroke="var(--ac3)" strokeWidth="1.8" />
          </g>
          <text
            x="96"
            y="146"
            textAnchor="middle"
            fontFamily="'IBM Plex Mono', monospace"
            fontSize="11"
            fill="var(--ac3)"
          >
            μ
          </text>
          {/* mass (animated group) */}
          <g ref={massRef} style={{ transition: 'none' }}>
            <rect
              x="176"
              y="60"
              width="84"
              height="60"
              rx="6"
              fill="var(--bg-accent)"
              stroke="var(--ac1)"
              strokeWidth="1.8"
              style={{ filter: 'drop-shadow(0 0 10px rgba(var(--ac1-rgb),0.3))' }}
            />
            <text x="218" y="96" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--tx-strong)">
              M
            </text>
            <line x1="260" y1="90" x2="320" y2="90" stroke="var(--ac4)" strokeWidth="2" markerEnd="url(#ah)" />
            <text
              x="290"
              y="80"
              textAnchor="middle"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize="11"
              fill="var(--ac4)"
            >
              F(t)
            </text>
          </g>
          <g ref={markerRef}>
            <line
              x1="218"
              y1="128"
              x2="218"
              y2="160"
              stroke="var(--tx-faint)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x="218"
              y="173"
              textAnchor="middle"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize="10"
              fill="var(--tx-5)"
            >
              x(t)
            </text>
          </g>
        </svg>
        <button
          onClick={pluck}
          style={{
            marginTop: 10,
            alignSelf: 'flex-start',
            background: 'rgba(var(--ac1-rgb),0.1)',
            border: '1px solid rgba(var(--ac1-rgb),0.45)',
            color: 'var(--ac1)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          ▷ Pluck the mass
        </button>
      </div>

      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid rgba(86,130,170,0.16)',
          borderRadius: 14,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.12em',
              color: 'var(--tx-5)',
              marginBottom: 12,
            }}
          >
            EQUATION OF MOTION
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 17,
              color: 'var(--tx-strong)',
              lineHeight: 1.5,
            }}
          >
            F(t) = M·<span style={{ color: 'var(--ac1)' }}>ẍ</span> +{' '}
            <span style={{ color: 'var(--ac3)' }}>μ·ẋ</span> +{' '}
            <span style={{ color: 'var(--ac2)' }}>K·x</span>
          </div>
        </div>
        <div style={{ height: 1, background: 'rgba(86,130,170,0.14)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 13 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span
              style={{
                color: 'var(--ac1)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600,
                width: 34,
                flex: 'none',
              }}
            >
              M ẍ
            </span>
            <span style={{ color: 'var(--tx-2b)' }}>inertia — resists acceleration</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span
              style={{
                color: 'var(--ac3)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600,
                width: 34,
                flex: 'none',
              }}
            >
              μ ẋ
            </span>
            <span style={{ color: 'var(--tx-2b)' }}>damping — opposes velocity</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span
              style={{
                color: 'var(--ac2)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600,
                width: 34,
                flex: 'none',
              }}
            >
              K x
            </span>
            <span style={{ color: 'var(--tx-2b)' }}>spring — pulls back toward rest</span>
          </div>
        </div>
      </div>
    </div>
  )
}

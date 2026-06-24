import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { usePalette } from '../../../theme/palette'
import { setupHiDPICanvas } from '../../../lib/canvas'
import { useOnResize } from '../../../lib/useRafLoop'
import { usePidGains } from '../PidGains'

export interface PIDSimulatorProps {
  plant?: 'sluggish' | 'balanced' | 'springy'
  showControlEffort?: boolean
}

type PlantKind = NonNullable<PIDSimulatorProps['plant']>

interface PlantParams {
  M: number
  mu: number
  K: number
}

function plantParams(p: PlantKind): PlantParams {
  if (p === 'sluggish') return { M: 1.5, mu: 11, K: 12 }
  if (p === 'springy') return { M: 1, mu: 3, K: 42 }
  return { M: 1, mu: 6, K: 20 }
}

interface SimResult {
  xs: number[]
  us: number[]
  dt: number
  T: number
  N: number
  sp: number
  peak: number
  unstable: boolean
  overshoot: number
  settling: number
  sse: number
  rise: number
  uMax: number
  finalVal: number
}

function simulate(
  kp: number,
  ki: number,
  kd: number,
  plant: PlantKind,
): SimResult {
  const sp = 1
  const { M, mu, K } = plantParams(plant)
  const dt = 0.004
  const T = 6
  const N = Math.round(T / dt)
  let x = 0
  let v = 0
  let integ = 0
  let prevE = 0
  const xs = new Array<number>(N + 1)
  const us = new Array<number>(N + 1)
  let peak = 0
  let unstable = false
  let uMax = 0
  for (let i = 0; i <= N; i++) {
    const e = sp - x
    integ += e * dt
    const deriv = i === 0 ? 0 : (e - prevE) / dt
    const u = kp * e + ki * integ + kd * deriv
    prevE = e
    xs[i] = x
    us[i] = u
    if (x > peak) peak = x
    if (Math.abs(u) > uMax) uMax = Math.abs(u)
    const a = (u - mu * v - K * x) / M
    v += a * dt
    x += v * dt
    if (!isFinite(x) || Math.abs(x) > 60 * sp) {
      unstable = true
      for (let j = i + 1; j <= N; j++) {
        xs[j] = (x > 0 ? 1 : -1) * 6 * sp
        us[j] = 0
      }
      break
    }
  }
  // metrics
  let fsum = 0
  let fc = 0
  for (let i = Math.floor(N * 0.95); i <= N; i++) {
    fsum += xs[i]
    fc++
  }
  const finalVal = fsum / fc
  const sse = sp - finalVal
  const overshoot = peak > sp ? ((peak - sp) / sp) * 100 : 0
  let rise = -1
  for (let i = 0; i <= N; i++) {
    if (xs[i] >= 0.9 * sp) {
      rise = i * dt
      break
    }
  }
  let lastOut = 0
  for (let i = 0; i <= N; i++) {
    if (Math.abs(xs[i] - sp) > 0.02 * sp) lastOut = i
  }
  const settling = lastOut * dt
  return {
    xs,
    us,
    dt,
    T,
    N,
    sp,
    peak,
    unstable,
    overshoot,
    settling,
    sse,
    rise,
    uMax,
    finalVal,
  }
}

const PRESET_MAP: Record<string, { kp: number; ki: number; kd: number }> = {
  P: { kp: 80, ki: 0, kd: 0 },
  PI: { kp: 90, ki: 120, kd: 0 },
  PID: { kp: 120, ki: 160, kd: 14 },
  Hot: { kp: 240, ki: 340, kd: 6 },
}

const PRESET_DEFS: Array<[string, string]> = [
  ['P', 'P only'],
  ['PI', 'PI'],
  ['PID', 'PID'],
  ['Hot', 'Aggressive'],
]

const mono = "'IBM Plex Mono', monospace"

export function PIDSimulator(props: PIDSimulatorProps) {
  const plant = props.plant ?? 'balanced'
  const showControlEffort = props.showControlEffort ?? false
  const { gains, setGains } = usePidGains()
  const { kp, ki, kd } = gains
  const P = usePalette()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const sim = useMemo(
    () => simulate(kp, ki, kd, plant),
    [kp, ki, kd, plant],
  )

  const draw = () => {
    const c = canvasRef.current
    if (!c) return
    const setup = setupHiDPICanvas(c)
    if (!setup) return
    const { ctx: g, width: W, height: H } = setup
    const s = sim
    const padL = 46
    const padR = 14
    const padT = 14
    const padB = 26
    const pw = W - padL - padR
    const ph = H - padT - padB
    const sp = s.sp
    let yMax = Math.max(sp * 1.8, s.peak * 1.12)
    if (!isFinite(yMax) || yMax <= 0) yMax = sp * 2
    if (s.unstable) yMax = sp * 2.4
    const X = (t: number) => padL + (t / s.T) * pw
    const Y = (val: number) =>
      padT + ph - (Math.max(0, Math.min(val, yMax)) / yMax) * ph
    // grid
    g.font = '10px "IBM Plex Mono", monospace'
    g.strokeStyle = P.grid
    g.lineWidth = 1
    g.fillStyle = P.axis
    for (let t = 0; t <= s.T; t++) {
      const px = X(t)
      g.beginPath()
      g.moveTo(px, padT)
      g.lineTo(px, padT + ph)
      g.stroke()
      g.fillText(t + 's', px - 6, padT + ph + 15)
    }
    const yt = 4
    for (let i = 0; i <= yt; i++) {
      const val = (yMax * i) / yt
      const py = Y(val)
      g.beginPath()
      g.moveTo(padL, py)
      g.lineTo(padL + pw, py)
      g.stroke()
      g.fillText(val.toFixed(1), 8, py + 3)
    }
    // settling band ±2%
    g.fillStyle = P.band
    const yb1 = Y(sp * 1.02)
    const yb2 = Y(sp * 0.98)
    g.fillRect(padL, yb1, pw, yb2 - yb1)
    // control effort overlay
    if (showControlEffort && s.uMax > 0) {
      g.strokeStyle = P.ac2line
      g.lineWidth = 1.3
      g.beginPath()
      for (let i = 0; i <= s.N; i += 3) {
        const px = X(i * s.dt)
        const val = (s.us[i] / s.uMax) * sp
        const py = Y(val)
        if (i === 0) g.moveTo(px, py)
        else g.lineTo(px, py)
      }
      g.stroke()
    }
    // setpoint
    g.strokeStyle = P.setpoint
    g.setLineDash([5, 4])
    g.lineWidth = 1.5
    g.beginPath()
    g.moveTo(padL, Y(sp))
    g.lineTo(padL + pw, Y(sp))
    g.stroke()
    g.setLineDash([])
    // response curve
    g.strokeStyle = P.ac1
    g.lineWidth = 2.2
    g.shadowColor = P.glow1
    g.shadowBlur = 10
    g.beginPath()
    for (let i = 0; i <= s.N; i++) {
      const px = X(i * s.dt)
      const py = Y(s.xs[i])
      if (i === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.stroke()
    g.shadowBlur = 0
    if (s.unstable) {
      g.fillStyle = P.ac5
      g.font = '600 13px "IBM Plex Mono", monospace'
      g.fillText('⚠ UNSTABLE — reduce gains', padL + 12, padT + 20)
    }
  }

  useEffect(() => {
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, P])

  useOnResize(() => draw())

  // ---- metrics formatting ----
  const s = sim
  const ovStr = s.unstable ? '—' : s.overshoot.toFixed(1) + '%'
  const settleStr = s.unstable
    ? '—'
    : s.settling >= s.T - 0.01
      ? '> 6 s'
      : s.settling.toFixed(2) + ' s'
  const sseStr = s.unstable
    ? '—'
    : Math.abs(s.sse) < 0.0005
      ? '0.000'
      : s.sse.toFixed(3)
  const riseStr =
    s.unstable || s.rise < 0 ? '—' : s.rise.toFixed(2) + ' s'

  // ---- stability badge ----
  let stableLabel = 'STABLE'
  let sbg = 'rgba(var(--ac4-rgb),0.12)'
  let sbd = 'rgba(var(--ac4-rgb),0.5)'
  let sc = 'var(--ac4)'
  if (s.unstable) {
    stableLabel = 'UNSTABLE'
    sbg = 'rgba(var(--ac5-rgb),0.14)'
    sbd = 'rgba(var(--ac5-rgb),0.55)'
    sc = 'var(--ac5)'
  } else if (s.overshoot > 35) {
    stableLabel = 'OSCILLATORY'
    sbg = 'rgba(var(--ac6-rgb),0.12)'
    sbd = 'rgba(var(--ac6-rgb),0.5)'
    sc = 'var(--ac6)'
  } else if (Math.abs(s.sse) > 0.03) {
    stableLabel = 'OFFSET'
    sbg = 'rgba(var(--ac2-rgb),0.12)'
    sbd = 'rgba(var(--ac2-rgb),0.5)'
    sc = 'var(--ac2)'
  }
  const stableStyle: CSSProperties = {
    fontFamily: mono,
    fontSize: '10px',
    letterSpacing: '0.08em',
    padding: '3px 9px',
    borderRadius: '20px',
    background: sbg,
    border: '1px solid ' + sbd,
    color: sc,
    fontWeight: 600,
  }

  // ---- presets (active = exact gain match) ----
  const accent = 'var(--ac1)'
  const metricCellStyle: CSSProperties = {
    background: 'var(--bg-inset)',
    border: '1px solid rgba(86,130,170,0.16)',
    borderRadius: '9px',
    padding: '10px 12px',
  }
  const metricLabelStyle: CSSProperties = {
    fontFamily: mono,
    fontSize: '9.5px',
    letterSpacing: '0.08em',
    color: 'var(--tx-5)',
    marginBottom: '4px',
  }
  const metricValueStyle: CSSProperties = {
    fontFamily: mono,
    fontSize: '17px',
    fontWeight: 600,
    color: 'var(--tx-strong)',
  }

  const metrics: Array<[string, string]> = [
    ['OVERSHOOT', ovStr],
    ['SETTLING', settleStr],
    ['SS ERROR', sseStr],
    ['RISE TIME', riseStr],
  ]

  return (
    <div
      style={{
        background: 'var(--bg-hero)',
        border: '1px solid rgba(var(--ac1-rgb),0.22)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 0 50px rgba(var(--ac1-rgb),0.06)',
      }}
    >
      <div
        data-collapse-grid
        style={{ display: 'grid', gridTemplateColumns: '1fr 300px' }}
      >
        {/* plot */}
        <div
          style={{
            padding: '16px',
            borderRight: '1px solid rgba(86,130,170,0.14)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontFamily: mono,
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: 'var(--tx-5)',
              }}
            >
              STEP RESPONSE · position vs. time
            </div>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                fontFamily: mono,
                fontSize: '10px',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: 'var(--tx-2b)',
                }}
              >
                <span
                  style={{
                    width: '14px',
                    height: '2px',
                    background: 'var(--ac1)',
                    display: 'inline-block',
                    boxShadow: '0 0 5px var(--ac1)',
                  }}
                />
                output
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: 'var(--tx-2b)',
                }}
              >
                <span
                  style={{
                    width: '14px',
                    height: 0,
                    borderTop: '1px dashed #8c9bb0',
                    display: 'inline-block',
                  }}
                />
                setpoint
              </span>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '300px', display: 'block' }}
          />
          {/* metrics */}
          <div
            data-collapse-metrics
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: '10px',
              marginTop: '14px',
            }}
          >
            {metrics.map(([label, value]) => (
              <div key={label} style={metricCellStyle}>
                <div style={metricLabelStyle}>{label}</div>
                <div style={metricValueStyle}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* controls */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'var(--bg-inset)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontFamily: mono,
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: 'var(--tx-5)',
              }}
            >
              CONTROLLER GAINS
            </div>
            <span style={stableStyle}>{stableLabel}</span>
          </div>

          {/* Kp */}
          <div style={{ color: 'var(--ac1)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '7px',
              }}
            >
              <span style={{ fontFamily: mono, fontSize: '13px', fontWeight: 600 }}>
                Kp{' '}
                <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>
                  proportional
                </span>
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--tx-strong)',
                }}
              >
                {kp}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={300}
              step={1}
              value={kp}
              onChange={(e) => setGains({ kp: Number(e.target.value) })}
              onInput={(e) =>
                setGains({ kp: Number((e.target as HTMLInputElement).value) })
              }
              style={{ width: '100%', color: 'var(--ac1)' }}
            />
          </div>

          {/* Ki */}
          <div style={{ color: 'var(--ac2)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '7px',
              }}
            >
              <span style={{ fontFamily: mono, fontSize: '13px', fontWeight: 600 }}>
                Ki{' '}
                <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>
                  integral
                </span>
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--tx-strong)',
                }}
              >
                {ki}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={400}
              step={1}
              value={ki}
              onChange={(e) => setGains({ ki: Number(e.target.value) })}
              onInput={(e) =>
                setGains({ ki: Number((e.target as HTMLInputElement).value) })
              }
              style={{ width: '100%', color: 'var(--ac2)' }}
            />
          </div>

          {/* Kd */}
          <div style={{ color: 'var(--ac3)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '7px',
              }}
            >
              <span style={{ fontFamily: mono, fontSize: '13px', fontWeight: 600 }}>
                Kd{' '}
                <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>
                  derivative
                </span>
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--tx-strong)',
                }}
              >
                {kd}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={0.5}
              value={kd}
              onChange={(e) => setGains({ kd: Number(e.target.value) })}
              onInput={(e) =>
                setGains({ kd: Number((e.target as HTMLInputElement).value) })
              }
              style={{ width: '100%', color: 'var(--ac3)' }}
            />
          </div>

          <div style={{ height: '1px', background: 'rgba(86,130,170,0.14)' }} />
          <div>
            <div
              style={{
                fontFamily: mono,
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: 'var(--tx-5)',
                marginBottom: '9px',
              }}
            >
              PRESETS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {PRESET_DEFS.map(([id, label]) => {
                const m = PRESET_MAP[id]
                const active =
                  gains.kp === m.kp && gains.ki === m.ki && gains.kd === m.kd
                const style: CSSProperties = {
                  fontFamily: mono,
                  fontSize: '11.5px',
                  padding: '7px 13px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: active ? 600 : 500,
                  background: active
                    ? 'rgba(var(--ac1-rgb),0.16)'
                    : 'transparent',
                  border:
                    '1px solid ' +
                    (active
                      ? 'rgba(var(--ac1-rgb),0.55)'
                      : 'rgba(86,130,170,0.22)'),
                  color: active ? accent : 'var(--tx-2b)',
                }
                return (
                  <button
                    key={id}
                    onClick={() => setGains({ ...m })}
                    style={style}
                  >
                    {label}
                  </button>
                )
              })}
              <button
                onClick={() => setGains({ kp: 0, ki: 0, kd: 0 })}
                style={{
                  fontFamily: mono,
                  fontSize: '11.5px',
                  padding: '7px 13px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: '1px solid rgba(86,130,170,0.22)',
                  color: 'var(--tx-6)',
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

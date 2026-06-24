import { useEffect, useRef, useState } from 'react'
import { usePalette, type Palette } from '../../../theme/palette'
import { setupHiDPICanvas, clamp } from '../../../lib/canvas'
import { useRafLoop, useOnResize } from '../../../lib/useRafLoop'

interface ArmState {
  th: number
  w: number
  integ: number
  prevE: number
  t: number
  V: number
  acc: number
  hist: { t: number; deg: number; vel: number; goal: number }[]
}

interface ArmGains {
  armKp: number
  armKi: number
  armKd: number
  armGoal: number
  armFF: boolean
  armKg: number
}

const ARM_CONSTS = { Cv: 2.0, Dv: 3.6, Gv: 8.0, Fv: 0.4, Vmax: 12 }

function freshArm(): ArmState {
  return { th: 0, w: 0, integ: 0, prevE: 0, t: 0, V: 0, acc: 0, hist: [] }
}

export function ArmSimulator() {
  const P = usePalette()

  const [armKp, setArmKp] = useState(18)
  const [armKi, setArmKi] = useState(0)
  const [armKd, setArmKd] = useState(2.5)
  const [armGoal, setArmGoal] = useState(60)
  const [armFF, setArmFF] = useState(true)
  const [armKg, setArmKg] = useState(4.0)

  // Mirror gains into a ref so the rAF loop always reads fresh values
  // without being restarted when sliders change.
  const gainsRef = useRef<ArmGains>({ armKp, armKi, armKd, armGoal, armFF, armKg })
  gainsRef.current = { armKp, armKi, armKd, armGoal, armFF, armKg }

  const arm = useRef<ArmState>(freshArm())

  const armCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const armGraphRef = useRef<HTMLCanvasElement | null>(null)
  const gaugeRef = useRef<HTMLCanvasElement | null>(null)

  const armAngleRef = useRef<HTMLSpanElement | null>(null)
  const armSpeedRef = useRef<HTMLSpanElement | null>(null)
  const armAccelRef = useRef<HTMLSpanElement | null>(null)
  const armVoltRef = useRef<HTMLSpanElement | null>(null)

  // Keep latest palette accessible to draw routines invoked from the loop.
  const palRef = useRef<Palette>(P)
  palRef.current = P

  function resetArm() {
    arm.current = freshArm()
  }

  function armStep(dt: number) {
    const p = ARM_CONSTS
    const st = gainsRef.current
    const a = arm.current
    const goal = (st.armGoal * Math.PI) / 180
    const e = goal - a.th
    a.integ += e * dt
    a.integ = Math.max(-4, Math.min(4, a.integ)) // anti-windup
    const deriv = (e - a.prevE) / dt
    a.prevE = e
    const Vpid = st.armKp * e + st.armKi * a.integ + st.armKd * deriv
    const Vff = st.armFF ? st.armKg * Math.cos(a.th) : 0
    let V = Vpid + Vff
    V = Math.max(-p.Vmax, Math.min(p.Vmax, V))
    a.V = V
    const acc = p.Cv * V - p.Dv * a.w - p.Gv * Math.cos(a.th) - p.Fv * Math.tanh(a.w / 0.04)
    a.acc = acc
    a.w += acc * dt
    a.th += a.w * dt
    const hi = Math.PI / 2
    if (a.th < 0) {
      a.th = 0
      if (a.w < 0) a.w = 0
    }
    if (a.th > hi) {
      a.th = hi
      if (a.w > 0) a.w = 0
    }
    a.t += dt
  }

  function drawArmScene() {
    const c = armCanvasRef.current
    if (!c) return
    const r = setupHiDPICanvas(c)
    if (!r) return
    const { ctx: g, width: W, height: H } = r
    const a = arm.current
    const px = W * 0.3,
      py = H * 0.8,
      L = Math.min(W * 0.5, H * 0.62)
    const pal = palRef.current
    g.font = "11px 'IBM Plex Mono', monospace"
    // horizontal baseline (dashed)
    g.strokeStyle = pal.baseline
    g.setLineDash([4, 4])
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(px, py)
    g.lineTo(px + L + 34, py)
    g.stroke()
    g.setLineDash([])
    // goal arm (ghost)
    const gth = (gainsRef.current.armGoal * Math.PI) / 180
    g.strokeStyle = pal.goalGhost
    g.lineWidth = 2.5
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(px, py)
    g.lineTo(px + Math.cos(gth) * L, py - Math.sin(gth) * L)
    g.stroke()
    // angle arc
    g.strokeStyle = pal.arc
    g.lineWidth = 1.5
    g.beginPath()
    g.arc(px, py, 30, 0, -a.th, true)
    g.stroke()
    g.fillStyle = pal.ac1
    g.fillText('θ', px + 38, py - 8)
    // arm
    const ex = px + Math.cos(a.th) * L,
      ey = py - Math.sin(a.th) * L
    g.strokeStyle = '#6f9bd6'
    g.lineWidth = 7
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(px, py)
    g.lineTo(ex, ey)
    g.stroke()
    g.fillStyle = pal.dim
    g.fillText('L', px + Math.cos(a.th) * L * 0.5 - 14, py - Math.sin(a.th) * L * 0.5 - 6)
    // mass block
    g.save()
    g.translate(ex, ey)
    g.rotate(-a.th)
    g.shadowColor = pal.glow1soft
    g.shadowBlur = 14
    g.fillStyle = pal.massBg
    g.strokeStyle = pal.ac1
    g.lineWidth = 2
    if (g.roundRect) {
      g.beginPath()
      g.roundRect(-16, -16, 32, 32, 6)
      g.fill()
      g.stroke()
    } else {
      g.fillRect(-16, -16, 32, 32)
      g.strokeRect(-16, -16, 32, 32)
    }
    g.shadowBlur = 0
    g.restore()
    // gravity vector W=mg
    g.strokeStyle = pal.ac5
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(ex, ey)
    g.lineTo(ex, ey + 44)
    g.stroke()
    g.fillStyle = pal.ac5
    g.beginPath()
    g.moveTo(ex, ey + 48)
    g.lineTo(ex - 4.5, ey + 39)
    g.lineTo(ex + 4.5, ey + 39)
    g.closePath()
    g.fill()
    g.font = "600 12px 'IBM Plex Mono', monospace"
    g.fillText('W=mg', ex + 8, ey + 42)
    // pivot
    g.fillStyle = pal.pivotBg
    g.strokeStyle = '#54677b'
    g.lineWidth = 2
    g.beginPath()
    g.arc(px, py, 6, 0, Math.PI * 2)
    g.fill()
    g.stroke()
  }

  function drawGauge() {
    const c = gaugeRef.current
    if (!c) return
    const r = setupHiDPICanvas(c)
    if (!r) return
    const { ctx: g, width: W, height: H } = r
    const a = arm.current
    const cx = W / 2,
      cy = H * 0.92,
      R = Math.min(W * 0.42, H * 0.82)
    const frac = clamp((a.th * 180) / Math.PI / 90, 0, 1)
    const pal = palRef.current
    // track
    g.lineCap = 'round'
    g.strokeStyle = pal.track
    g.lineWidth = 8
    g.beginPath()
    g.arc(cx, cy, R, Math.PI, Math.PI * 2)
    g.stroke()
    // value arc
    g.strokeStyle = pal.ac1
    g.lineWidth = 8
    g.shadowColor = pal.glow1
    g.shadowBlur = 8
    g.beginPath()
    g.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * frac)
    g.stroke()
    g.shadowBlur = 0
    // ticks + labels
    g.font = "9px 'IBM Plex Mono', monospace"
    g.textAlign = 'center'
    ;[0, 30, 60, 90].forEach((v) => {
      const ang = Math.PI + Math.PI * (v / 90)
      const ca = Math.cos(ang),
        sa = Math.sin(ang)
      g.strokeStyle = pal.tick
      g.lineWidth = 1.5
      g.beginPath()
      g.moveTo(cx + ca * (R - 12), cy + sa * (R - 12))
      g.lineTo(cx + ca * (R + 2), cy + sa * (R + 2))
      g.stroke()
      g.fillStyle = pal.label
      g.fillText(String(v), cx + ca * (R - 22), cy + sa * (R - 22) + 3)
    })
    // needle
    const ang = Math.PI + Math.PI * frac
    g.strokeStyle = pal.strong
    g.lineWidth = 2.5
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(cx, cy)
    g.lineTo(cx + Math.cos(ang) * (R - 6), cy + Math.sin(ang) * (R - 6))
    g.stroke()
    g.fillStyle = pal.ac1
    g.beginPath()
    g.arc(cx, cy, 4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = pal.strong
    g.font = "600 17px 'IBM Plex Mono', monospace"
    g.fillText(((a.th * 180) / Math.PI).toFixed(0) + '°', cx, cy - R * 0.3)
    g.textAlign = 'left'
  }

  function drawArmGraph() {
    const c = armGraphRef.current
    if (!c) return
    const r = setupHiDPICanvas(c)
    if (!r) return
    const { ctx: g, width: W, height: H } = r
    const a = arm.current
    const padL = 34,
      padR = 32,
      padT = 12,
      padB = 20,
      pw = W - padL - padR,
      ph = H - padT - padB
    const tMax = Math.max(4, a.t),
      tMin = tMax - 4
    const degMax = 120,
      velMin = -4,
      velMax = 12
    const X = (t: number) => padL + ((t - tMin) / 4) * pw
    const Yd = (v: number) => padT + ph - (Math.max(0, Math.min(v, degMax)) / degMax) * ph
    const Yv = (v: number) =>
      padT + ph - ((Math.max(velMin, Math.min(v, velMax)) - velMin) / (velMax - velMin)) * ph
    g.font = "9px 'IBM Plex Mono', monospace"
    const pal = palRef.current
    // grid
    g.strokeStyle = pal.grid
    g.lineWidth = 1
    g.fillStyle = pal.axis
    for (let i = 0; i <= 4; i++) {
      const t = tMin + i
      const x = X(t)
      g.beginPath()
      g.moveTo(x, padT)
      g.lineTo(x, padT + ph)
      g.stroke()
      g.fillText((tMax - (4 - i)).toFixed(0) + 's', x - 6, padT + ph + 14)
    }
    for (let i = 0; i <= 4; i++) {
      const val = (degMax * i) / 4
      const y = Yd(val)
      g.beginPath()
      g.moveTo(padL, y)
      g.lineTo(padL + pw, y)
      g.stroke()
    }
    // left axis (deg) labels cyan
    g.fillStyle = pal.ac1
    g.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const val = (degMax * i) / 4
      g.fillText(val.toFixed(0), padL - 5, Yd(val) + 3)
    }
    // right axis (vel) labels pink
    g.fillStyle = pal.ac3
    g.textAlign = 'left'
    for (let i = 0; i <= 4; i++) {
      const val = velMin + ((velMax - velMin) * i) / 4
      g.fillText(val.toFixed(0), padL + pw + 5, Yv(val) + 3)
    }
    g.textAlign = 'left'
    // zero line for velocity
    g.strokeStyle = pal.velZero
    g.setLineDash([3, 3])
    g.beginPath()
    g.moveTo(padL, Yv(0))
    g.lineTo(padL + pw, Yv(0))
    g.stroke()
    g.setLineDash([])
    if (a.hist.length < 2) return
    // goal line (green)
    const goalDeg = gainsRef.current.armGoal
    g.strokeStyle = pal.goalLine
    g.setLineDash([5, 4])
    g.lineWidth = 1.6
    g.beginPath()
    g.moveTo(padL, Yd(goalDeg))
    g.lineTo(padL + pw, Yd(goalDeg))
    g.stroke()
    g.setLineDash([])
    // velocity (pink)
    g.strokeStyle = pal.ac3
    g.lineWidth = 1.6
    g.beginPath()
    a.hist.forEach((h, i) => {
      const x = X(h.t),
        y = Yv(h.vel)
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
    })
    g.stroke()
    // position (cyan, glow)
    g.strokeStyle = pal.ac1
    g.lineWidth = 2.2
    g.shadowColor = pal.glow1
    g.shadowBlur = 9
    g.beginPath()
    a.hist.forEach((h, i) => {
      const x = X(h.t),
        y = Yd(h.deg)
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
    })
    g.stroke()
    g.shadowBlur = 0
  }

  function drawAll() {
    drawArmScene()
    drawArmGraph()
    drawGauge()
  }

  useRafLoop((dt) => {
    const sub = 0.002
    const n = Math.max(1, Math.round(dt / sub))
    for (let i = 0; i < n; i++) armStep(dt / n)
    const a = arm.current
    a.hist.push({ t: a.t, deg: (a.th * 180) / Math.PI, vel: a.w, goal: gainsRef.current.armGoal })
    while (a.hist.length > 2 && a.hist[0].t < a.t - 4.2) a.hist.shift()
    drawArmScene()
    drawArmGraph()
    drawGauge()
    if (armAngleRef.current) armAngleRef.current.textContent = ((a.th * 180) / Math.PI).toFixed(1)
    if (armSpeedRef.current)
      armSpeedRef.current.textContent = (Math.abs(a.w) < 0.005 ? 0 : a.w).toFixed(2)
    if (armAccelRef.current)
      armAccelRef.current.textContent = (Math.abs(a.acc) < 0.05 ? 0 : a.acc).toFixed(1)
    if (armVoltRef.current) armVoltRef.current.textContent = a.V.toFixed(2)
  }, true)

  useOnResize(() => drawAll())

  // Repaint on theme change even if the loop hasn't ticked.
  useEffect(() => {
    drawAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [P])

  const ffOn = armFF
  const ffBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '11.5px',
    fontWeight: 600,
    padding: '7px 13px',
    borderRadius: '20px',
    cursor: 'pointer',
    background: ffOn ? 'rgba(var(--ac4-rgb),0.14)' : 'rgba(86,130,170,0.08)',
    border: '1px solid ' + (ffOn ? 'rgba(var(--ac4-rgb),0.55)' : 'rgba(86,130,170,0.28)'),
    color: ffOn ? 'var(--ac4)' : 'var(--tx-6)',
  }
  const ffDotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
    background: ffOn ? 'var(--ac4)' : '#54677b',
    boxShadow: ffOn ? '0 0 8px #34d399' : 'none',
  }
  const kgWrapStyle: React.CSSProperties = { color: 'var(--ac6)', opacity: ffOn ? 1 : 0.4 }

  const mono = "'IBM Plex Mono', monospace"
  const metricCard: React.CSSProperties = {
    background: 'var(--bg-inset)',
    border: '1px solid rgba(86,130,170,0.16)',
    borderRadius: 9,
    padding: '10px 12px',
  }
  const metricLabel: React.CSSProperties = {
    fontFamily: mono,
    fontSize: 9,
    letterSpacing: '0.05em',
    color: 'var(--tx-5)',
    marginBottom: 4,
  }
  const metricVal: React.CSSProperties = {
    fontFamily: mono,
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--tx-strong)',
  }
  const metricUnit: React.CSSProperties = { color: 'var(--tx-5)', fontSize: 11 }
  const sliderLabel: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 7,
  }
  const sliderName: React.CSSProperties = { fontFamily: mono, fontSize: 13, fontWeight: 600 }
  const sliderValue: React.CSSProperties = {
    fontFamily: mono,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--tx-strong)',
  }
  const sectionLabel: React.CSSProperties = {
    fontFamily: mono,
    fontSize: 10,
    letterSpacing: '0.12em',
    color: 'var(--tx-5)',
  }
  const legendItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5 }

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
      {/* spec strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '7px 18px',
          padding: '11px 18px',
          borderBottom: '1px solid rgba(86,130,170,0.14)',
          background: 'var(--bg-inset)',
          fontFamily: mono,
          fontSize: 11,
          color: 'var(--tx-2b)',
        }}
      >
        <span>
          <span style={{ color: 'var(--tx-5)' }}>motor</span> Falcon 500
        </span>
        <span>
          <span style={{ color: 'var(--tx-5)' }}>mass</span> 0.6 kg
        </span>
        <span>
          <span style={{ color: 'var(--tx-5)' }}>arm</span> 0.4 m
        </span>
        <span>
          <span style={{ color: 'var(--tx-5)' }}>gear</span> 11.652:1
        </span>
        <span>
          <span style={{ color: 'var(--tx-5)' }}>MOI</span> 0.02 kg·m²
        </span>
        <span>
          <span style={{ color: 'var(--tx-5)' }}>range</span> 0–90°
        </span>
      </div>

      <div
        data-collapse-grid
        style={{ display: 'grid', gridTemplateColumns: '1fr 320px' }}
      >
        {/* left: arm scene + graph + metrics */}
        <div style={{ padding: 16, borderRight: '1px solid rgba(86,130,170,0.14)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={sectionLabel}>ARM · gravity-loaded mechanism</div>
            <div
              style={{
                fontFamily: mono,
                fontSize: 10,
                color: 'var(--tx-2b)',
                display: 'flex',
                gap: 12,
              }}
            >
              <span style={legendItem}>
                <span
                  style={{
                    width: 14,
                    height: 3,
                    background: '#6f9bd6',
                    display: 'inline-block',
                    borderRadius: 2,
                  }}
                />
                arm
              </span>
              <span style={legendItem}>
                <span
                  style={{
                    width: 14,
                    height: 3,
                    background: 'var(--ac4)',
                    display: 'inline-block',
                    borderRadius: 2,
                  }}
                />
                goal
              </span>
              <span style={legendItem}>
                <span
                  style={{
                    width: 14,
                    height: 2,
                    background: 'var(--ac5)',
                    display: 'inline-block',
                    borderRadius: 2,
                  }}
                />
                mg
              </span>
            </div>
          </div>
          <canvas ref={armCanvasRef} style={{ width: '100%', height: 230, display: 'block' }} />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: '16px 0 8px',
            }}
          >
            <div style={sectionLabel}>RESPONSE · angle &amp; velocity vs time</div>
            <div
              style={{
                fontFamily: mono,
                fontSize: 10,
                color: 'var(--tx-2b)',
                display: 'flex',
                gap: 12,
              }}
            >
              <span style={legendItem}>
                <span
                  style={{ width: 14, height: 2, background: 'var(--ac1)', display: 'inline-block' }}
                />
                θ deg
              </span>
              <span style={legendItem}>
                <span
                  style={{ width: 14, height: 2, background: 'var(--ac3)', display: 'inline-block' }}
                />
                ω rad/s
              </span>
            </div>
          </div>
          <canvas ref={armGraphRef} style={{ width: '100%', height: 170, display: 'block' }} />

          <div
            data-collapse-metrics
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 10,
              marginTop: 14,
            }}
          >
            <div style={metricCard}>
              <div style={metricLabel}>ARM ANGLE</div>
              <div style={metricVal}>
                <span ref={armAngleRef}>0.0</span>
                <span style={metricUnit}> °</span>
              </div>
            </div>
            <div style={metricCard}>
              <div style={metricLabel}>ARM SPEED</div>
              <div style={metricVal}>
                <span ref={armSpeedRef}>0.00</span>
                <span style={metricUnit}> rad/s</span>
              </div>
            </div>
            <div style={metricCard}>
              <div style={metricLabel}>ARM ACCEL</div>
              <div style={metricVal}>
                <span ref={armAccelRef}>0.0</span>
                <span style={metricUnit}> rad/s²</span>
              </div>
            </div>
            <div style={metricCard}>
              <div style={metricLabel}>VOLTAGE</div>
              <div style={metricVal}>
                <span ref={armVoltRef}>0.00</span>
                <span style={metricUnit}> V</span>
              </div>
            </div>
          </div>
        </div>

        {/* right: gauge + controls */}
        <div
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 15,
            background: 'var(--bg-inset)',
          }}
        >
          <div>
            <div style={{ ...sectionLabel, marginBottom: 2, textAlign: 'center' }}>
              ARM ANGLE GAUGE
            </div>
            <canvas ref={gaugeRef} style={{ width: '100%', height: 118, display: 'block' }} />
          </div>

          <div style={{ height: 1, background: 'rgba(86,130,170,0.14)' }} />

          {/* goal */}
          <div style={{ color: 'var(--ac4)' }}>
            <div style={sliderLabel}>
              <span style={sliderName}>
                Goal <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>position</span>
              </span>
              <span style={sliderValue}>{armGoal}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={armGoal}
              onChange={(e) => setArmGoal(Number(e.target.value))}
              style={{ width: '100%', color: 'var(--ac4)' }}
            />
          </div>

          <div style={sectionLabel}>CONTROLLER GAINS</div>
          {/* Kp */}
          <div style={{ color: 'var(--ac1)' }}>
            <div style={sliderLabel}>
              <span style={sliderName}>
                Kp <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>proportional</span>
              </span>
              <span style={sliderValue}>{armKp.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="0.5"
              value={armKp}
              onChange={(e) => setArmKp(Number(e.target.value))}
              style={{ width: '100%', color: 'var(--ac1)' }}
            />
          </div>
          {/* Ki */}
          <div style={{ color: 'var(--ac2)' }}>
            <div style={sliderLabel}>
              <span style={sliderName}>
                Ki <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>integral</span>
              </span>
              <span style={sliderValue}>{armKi.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="0.5"
              value={armKi}
              onChange={(e) => setArmKi(Number(e.target.value))}
              style={{ width: '100%', color: 'var(--ac2)' }}
            />
          </div>
          {/* Kd */}
          <div style={{ color: 'var(--ac3)' }}>
            <div style={sliderLabel}>
              <span style={sliderName}>
                Kd <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>derivative</span>
              </span>
              <span style={sliderValue}>{armKd.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.1"
              value={armKd}
              onChange={(e) => setArmKd(Number(e.target.value))}
              style={{ width: '100%', color: 'var(--ac3)' }}
            />
          </div>

          <div style={{ height: 1, background: 'rgba(86,130,170,0.14)' }} />

          {/* feed forward */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ lineHeight: 1.25 }}>
              <div
                style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: 'var(--tx-strong)' }}
              >
                Feed-forward
              </div>
              <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--tx-3)' }}>
                gravity hold · Kg·cos θ
              </div>
            </div>
            <button onClick={() => setArmFF((v) => !v)} style={ffBtnStyle}>
              <span style={ffDotStyle} />
              {ffOn ? 'ON' : 'OFF'}
            </button>
          </div>
          {/* Kg */}
          <div style={kgWrapStyle}>
            <div style={sliderLabel}>
              <span style={sliderName}>
                Kg <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>gravity gain</span>
              </span>
              <span style={sliderValue}>{armKg.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="0.1"
              value={armKg}
              onChange={(e) => setArmKg(Number(e.target.value))}
              style={{ width: '100%', color: 'var(--ac6)' }}
            />
          </div>

          <button
            onClick={resetArm}
            style={{
              marginTop: 2,
              background: 'rgba(var(--ac1-rgb),0.1)',
              border: '1px solid rgba(var(--ac1-rgb),0.4)',
              color: 'var(--ac1)',
              fontFamily: mono,
              fontSize: 12,
              fontWeight: 500,
              padding: 10,
              borderRadius: 9,
              cursor: 'pointer',
            }}
          >
            ↻ Restart from 0°
          </button>
        </div>
      </div>
    </div>
  )
}

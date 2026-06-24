import { useState } from 'react'
import { usePidGains } from '../PidGains'

const mono = "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace"

export function ZieglerNichols() {
  const { setGains, scrollToSimulator } = usePidGains()
  const [znKu, setZnKu] = useState(200)
  const [znTu, setZnTu] = useState(0.5)

  // Z–N derived (PID rules)
  const Kp = 0.6 * znKu
  const Ti = 0.5 * znTu
  const Td = znTu / 8
  const Ki = Kp / Ti
  const Kd = Kp * Td

  const znKp = Math.round(Kp)
  const znKi = Math.round(Ki)
  const znKd = (Math.round(Kd * 10) / 10).toFixed(1)

  const applyZn = () => {
    setGains({
      kp: Math.round(Kp),
      ki: Math.min(400, Math.round(Ki)),
      kd: Math.min(60, Math.round(Kd * 2) / 2),
    })
    scrollToSimulator()
  }

  return (
    <div
      className="dc-tunegrid"
      data-collapse-grid=""
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 18,
        alignItems: 'start',
      }}
    >
      {/* Rules table */}
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid rgba(86,130,170,0.16)',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: mono,
          }}
        >
          <thead>
            <tr style={{ background: 'var(--bg-thead)' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 18px',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  color: 'var(--tx-3)',
                  fontWeight: 600,
                }}
              >
                CONTROL TYPE
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  color: 'var(--ac1)',
                  fontWeight: 600,
                }}
              >
                Kp
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  color: 'var(--ac2)',
                  fontWeight: 600,
                }}
              >
                Ti
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  color: 'var(--ac3)',
                  fontWeight: 600,
                }}
              >
                Td
              </th>
            </tr>
          </thead>
          <tbody style={{ fontSize: 13.5, color: 'var(--tx-bright)' }}>
            <tr style={{ borderTop: '1px solid rgba(86,130,170,0.12)' }}>
              <td style={{ padding: '13px 18px', color: 'var(--tx-1)' }}>P</td>
              <td style={{ padding: '13px 14px' }}>0.5 Ku</td>
              <td style={{ padding: '13px 14px', color: 'var(--tx-5)' }}>—</td>
              <td style={{ padding: '13px 14px', color: 'var(--tx-5)' }}>—</td>
            </tr>
            <tr style={{ borderTop: '1px solid rgba(86,130,170,0.12)' }}>
              <td style={{ padding: '13px 18px', color: 'var(--tx-1)' }}>PI</td>
              <td style={{ padding: '13px 14px' }}>0.45 Ku</td>
              <td style={{ padding: '13px 14px' }}>Tu / 1.2</td>
              <td style={{ padding: '13px 14px', color: 'var(--tx-5)' }}>—</td>
            </tr>
            <tr
              style={{
                borderTop: '1px solid rgba(86,130,170,0.12)',
                background: 'rgba(var(--ac1-rgb),0.05)',
              }}
            >
              <td
                style={{
                  padding: '13px 18px',
                  color: 'var(--ac1)',
                  fontWeight: 600,
                }}
              >
                PID
              </td>
              <td style={{ padding: '13px 14px' }}>0.6 Ku</td>
              <td style={{ padding: '13px 14px' }}>0.5 Tu</td>
              <td style={{ padding: '13px 14px' }}>Tu / 8</td>
            </tr>
          </tbody>
        </table>
        <div
          style={{
            padding: '11px 18px',
            fontFamily: mono,
            fontSize: 10.5,
            color: 'var(--tx-5)',
            borderTop: '1px solid rgba(86,130,170,0.12)',
          }}
        >
          Ki = Kp / Ti&nbsp;·&nbsp;Kd = Kp · Td
        </div>
      </div>

      {/* Z–N calculator */}
      <div
        style={{
          background: 'var(--bg-hero)',
          border: '1px solid rgba(var(--ac1-rgb),0.22)',
          borderRadius: 14,
          padding: 18,
        }}
      >
        <div
          style={{
            fontFamily: mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            color: 'var(--tx-5)',
            marginBottom: 14,
          }}
        >
          Z–N CALCULATOR
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontFamily: mono,
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--ac1)' }}>
                Ku <span style={{ color: 'var(--tx-3)' }}>ultimate gain</span>
              </span>
              <span style={{ color: 'var(--tx-strong)', fontWeight: 600 }}>{znKu}</span>
            </div>
            <input
              type="range"
              min="20"
              max="320"
              step="2"
              value={znKu}
              onChange={(e) => setZnKu(Number(e.target.value))}
              style={{ width: '100%', color: 'var(--ac1)' }}
            />
          </div>
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontFamily: mono,
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--ac1)' }}>
                Tu <span style={{ color: 'var(--tx-3)' }}>period (s)</span>
              </span>
              <span style={{ color: 'var(--tx-strong)', fontWeight: 600 }}>{znTu.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.4"
              step="0.02"
              value={znTu}
              onChange={(e) => setZnTu(Number(e.target.value))}
              style={{ width: '100%', color: 'var(--ac1)' }}
            />
          </div>
          <div
            style={{
              background: 'var(--bg-inset)',
              border: '1px solid rgba(86,130,170,0.16)',
              borderRadius: 9,
              padding: '11px 13px',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: mono,
              fontSize: 12.5,
            }}
          >
            <span style={{ color: 'var(--ac1)' }}>Kp {znKp}</span>
            <span style={{ color: 'var(--ac2)' }}>Ki {znKi}</span>
            <span style={{ color: 'var(--ac3)' }}>Kd {znKd}</span>
          </div>
          <button
            onClick={applyZn}
            style={{
              background: 'var(--ac1)',
              color: 'var(--on-ac)',
              border: 'none',
              fontFamily: mono,
              fontSize: 12.5,
              fontWeight: 600,
              padding: 11,
              borderRadius: 9,
              cursor: 'pointer',
            }}
          >
            ↑ Apply to simulator
          </button>
        </div>
      </div>
    </div>
  )
}

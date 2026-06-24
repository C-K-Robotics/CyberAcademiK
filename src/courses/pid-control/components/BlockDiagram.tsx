export function BlockDiagram() {
  return (
    <>
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid rgba(86,130,170,0.16)',
          borderRadius: 14,
          padding: '8px 8px 4px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 13,
            left: 16,
            fontFamily: "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            color: 'var(--tx-5)',
            zIndex: 2,
          }}
        >
          CLOSED-LOOP FEEDBACK
        </div>
        <svg viewBox="0 0 760 230" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <marker id="ah" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L8,4.5 L0,9 z" fill="#54677b" />
            </marker>
            <marker id="ahc" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L8,4.5 L0,9 z" fill="var(--ac1)" />
            </marker>
          </defs>

          {/* input */}
          <text x="20" y="86" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="13" fill="var(--tx-2b)">
            r(t)
          </text>
          <text x="20" y="100" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="9" fill="var(--tx-5)">
            setpoint
          </text>
          <line x1="56" y1="90" x2="104" y2="90" stroke="#54677b" strokeWidth="1.6" markerEnd="url(#ah)" />

          {/* summing junction */}
          <circle cx="124" cy="90" r="19" fill="var(--bg-deep)" stroke="#54677b" strokeWidth="1.6" />
          <text x="124" y="84" textAnchor="middle" fontSize="13" fill="var(--tx-1)">
            Σ
          </text>
          <text x="110" y="80" fontSize="12" fill="var(--ac4)">
            +
          </text>
          <text x="112" y="112" fontSize="13" fill="var(--ac5)">
            −
          </text>

          {/* error */}
          <text x="150" y="82" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="12" fill="var(--ac1)">
            e(t)
          </text>
          <line
            x1="143"
            y1="90"
            x2="196"
            y2="90"
            stroke="var(--ac1)"
            strokeWidth="1.8"
            markerEnd="url(#ahc)"
            strokeDasharray="6 6"
            style={{ animation: 'flow 1s linear infinite' }}
          />

          {/* controller */}
          <rect x="198" y="62" width="138" height="56" rx="9" fill="var(--bg-accent)" stroke="var(--ac1)" strokeWidth="1.4" />
          <text x="267" y="86" textAnchor="middle" fontSize="13.5" fontWeight="600" fill="var(--tx-strong)">
            PID Controller
          </text>
          <text x="267" y="104" textAnchor="middle" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="10" fill="var(--ac1b)">
            Kp · Ki · Kd
          </text>

          {/* u(t) */}
          <text x="350" y="82" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="12" fill="var(--tx-2b)">
            u(t)
          </text>
          <line x1="336" y1="90" x2="404" y2="90" stroke="#54677b" strokeWidth="1.6" markerEnd="url(#ah)" />

          {/* process */}
          <rect x="406" y="62" width="150" height="56" rx="9" fill="var(--bg-block)" stroke="#54677b" strokeWidth="1.4" />
          <text x="481" y="86" textAnchor="middle" fontSize="13.5" fontWeight="600" fill="var(--tx-strong)">
            Process / Plant
          </text>
          <text x="481" y="104" textAnchor="middle" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="10" fill="var(--tx-3)">
            mass · spring · damper
          </text>

          {/* output */}
          <text x="640" y="82" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="13" fill="var(--tx-2b)">
            y(t)
          </text>
          <text x="640" y="96" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="9" fill="var(--tx-5)">
            measured
          </text>
          <line x1="556" y1="90" x2="700" y2="90" stroke="#54677b" strokeWidth="1.6" />
          <circle cx="624" cy="90" r="3" fill="#54677b" />

          {/* feedback path */}
          <line x1="624" y1="90" x2="624" y2="180" stroke="#54677b" strokeWidth="1.6" />
          <line x1="624" y1="180" x2="438" y2="180" stroke="#54677b" strokeWidth="1.6" />
          <rect x="318" y="158" width="120" height="44" rx="8" fill="var(--bg-block)" stroke="#54677b" strokeWidth="1.4" />
          <text x="378" y="184" textAnchor="middle" fontSize="12.5" fill="var(--tx-1)">
            Sensor
          </text>
          <line x1="318" y1="180" x2="124" y2="180" stroke="#54677b" strokeWidth="1.6" />
          <line x1="124" y1="180" x2="124" y2="111" stroke="#54677b" strokeWidth="1.6" markerEnd="url(#ah)" />
        </svg>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 9,
          marginTop: 14,
          fontFamily: "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace",
          fontSize: 11,
          color: 'var(--tx-3)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 2, background: 'var(--ac1)', display: 'inline-block', borderRadius: 2 }} /> error
          path (live)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 2, background: '#54677b', display: 'inline-block', borderRadius: 2 }} /> signal
          path
        </span>
      </div>
    </>
  )
}

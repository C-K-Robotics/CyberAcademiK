export function OpenBlockDiagram() {
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
          OPEN-LOOP (FEEDFORWARD)
        </div>
        <svg viewBox="0 0 760 230" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <marker id="ah0" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L8,4.5 L0,9 z" fill="#54677b" />
            </marker>
          </defs>

          {/* input — command */}
          <text x="20" y="86" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="13" fill="var(--tx-2b)">
            c(t)
          </text>
          <text x="20" y="100" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="9" fill="var(--tx-5)">
            command
          </text>
          <line x1="50" y1="90" x2="180" y2="90" stroke="#54677b" strokeWidth="1.6" markerEnd="url(#ah0)" />

          {/* controller */}
          <rect x="182" y="62" width="138" height="56" rx="9" fill="var(--bg-accent)" stroke="var(--ac1)" strokeWidth="1.4" />
          <text x="251" y="86" textAnchor="middle" fontSize="13.5" fontWeight="600" fill="var(--tx-strong)">
            Controller
          </text>
          <text x="251" y="104" textAnchor="middle" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="10" fill="var(--ac1b)">
            open-loop gain
          </text>

          {/* u(t) — controller output, drawn in the gap before the plant */}
          <text x="352" y="82" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="12" fill="var(--tx-2b)">
            u(t)
          </text>
          <line x1="320" y1="90" x2="416" y2="90" stroke="#54677b" strokeWidth="1.6" markerEnd="url(#ah0)" />

          {/* plant */}
          <rect x="418" y="62" width="100" height="56" rx="9" fill="var(--bg-block)" stroke="#54677b" strokeWidth="1.4" />
          <text x="468" y="86" textAnchor="middle" fontSize="13.5" fontWeight="600" fill="var(--tx-strong)">
            Plant
          </text>
          <text x="468" y="104" textAnchor="middle" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="10" fill="var(--tx-3)">
            system
          </text>

          {/* output — runs off the edge: nothing ever measures it */}
          <line x1="518" y1="90" x2="700" y2="90" stroke="#54677b" strokeWidth="1.6" markerEnd="url(#ah0)" />
          <text x="600" y="82" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="13" fill="var(--tx-2b)">
            y(t)
          </text>
          <text x="600" y="108" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="9" fill="var(--ac5)">
            blind output
          </text>

          {/* the feedback path that isn't there */}
          <line x1="500" y1="120" x2="500" y2="200" stroke="var(--ac5)" strokeWidth="1.2" strokeDasharray="4 4" />
          <line x1="500" y1="200" x2="280" y2="200" stroke="var(--ac5)" strokeWidth="1.2" strokeDasharray="4 4" />
          <rect x="300" y="185" width="130" height="24" rx="6" fill="var(--bg-panel)" stroke="var(--ac5)" strokeWidth="1" />
          <text x="365" y="201" textAnchor="middle" fontFamily="'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace" fontSize="10" fill="var(--ac5)">
            ✕ no feedback
          </text>
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
          <span style={{ width: 18, height: 2, background: 'var(--ac1)', display: 'inline-block', borderRadius: 2 }} /> controller / gain
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 2, background: '#54677b', display: 'inline-block', borderRadius: 2 }} /> signal path
        </span>
      </div>
    </>
  )
}

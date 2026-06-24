import type { ReactNode } from 'react'
import { Info, Lightbulb, TriangleAlert } from 'lucide-react'

type CalloutType = 'info' | 'tip' | 'warn'

const CONFIG: Record<CalloutType, { accent: string; rgb: string; icon: typeof Info }> = {
  info: { accent: '--ac1', rgb: '--ac1-rgb', icon: Info },
  tip: { accent: '--ac4', rgb: '--ac4-rgb', icon: Lightbulb },
  warn: { accent: '--ac6', rgb: '--ac6-rgb', icon: TriangleAlert },
}

interface CalloutProps {
  type?: CalloutType
  title?: string
  children?: ReactNode
}

/** A coloured aside box for tips, notes, and warnings inside lesson prose. */
export function Callout({ type = 'info', title, children }: CalloutProps) {
  const { accent, rgb, icon: Icon } = CONFIG[type]
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        background: `rgba(var(${rgb}),0.07)`,
        border: `1px solid rgba(var(${rgb}),0.28)`,
        borderLeft: `3px solid var(${accent})`,
        borderRadius: 11,
        padding: '15px 18px',
        margin: '20px 0',
      }}
    >
      <Icon size={18} color={`var(${accent})`} style={{ flex: 'none', marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx-strong)', marginBottom: 4 }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--tx-2)' }}>{children}</div>
      </div>
    </div>
  )
}

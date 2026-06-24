import { Check, Copy } from 'lucide-react'
import {
  Children,
  isValidElement,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import './mdx.css'

const mono = "'IBM Plex Mono', monospace"

interface CodeTabProps {
  label: string
  children?: ReactNode
}

/** Marker element: carries a tab label and wraps a single markdown code block. */
export function CodeTab(_props: CodeTabProps) {
  // Rendered by <CodeTabs>; never renders on its own.
  return null
}

interface CodeTabsProps {
  children?: ReactNode
}

/**
 * A tabbed code viewer with a copy button. Authors nest one <CodeTab label="…">
 * per language, each containing a fenced markdown code block:
 *
 * <CodeTabs>
 *   <CodeTab label="Drive.java">```java … ```</CodeTab>
 *   <CodeTab label="Drive.cpp">```cpp … ```</CodeTab>
 * </CodeTabs>
 */
export function CodeTabs({ children }: CodeTabsProps) {
  const tabs = Children.toArray(children).filter(
    (c): c is ReactElement<CodeTabProps> => isValidElement(c),
  )
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const copy = () => {
    const text = bodyRef.current?.innerText ?? ''
    try {
      void navigator.clipboard?.writeText(text)
    } catch {
      /* clipboard may be unavailable — ignore */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  if (tabs.length === 0) return null
  const current = tabs[Math.min(active, tabs.length - 1)]

  return (
    <div
      style={{
        background: 'var(--bg-hero)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        overflow: 'hidden',
        margin: '8px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--line)',
          background: 'var(--bg-inset)',
        }}
      >
        {tabs.map((tab, i) => {
          const isActive = i === active
          return (
            <button
              key={tab.props.label + i}
              type="button"
              onClick={() => setActive(i)}
              style={{
                fontFamily: mono,
                fontSize: 12.5,
                padding: '11px 18px',
                cursor: 'pointer',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--ac1)' : 'transparent'}`,
                background: isActive ? 'rgba(var(--ac1-rgb),0.06)' : 'transparent',
                color: isActive ? 'var(--ac1)' : 'var(--tx-3)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {tab.props.label}
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={copy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginRight: 12,
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--tx-2b)',
            fontFamily: mono,
            fontSize: 11,
            padding: '6px 12px',
            borderRadius: 7,
            cursor: 'pointer',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <div
        ref={bodyRef}
        className="codetabs-body"
        style={{
          padding: '6px 4px',
          overflowX: 'auto',
          fontFamily: mono,
          fontSize: 12.5,
          lineHeight: 1.7,
          color: 'var(--tx-1)',
        }}
      >
        {current.props.children}
      </div>
    </div>
  )
}

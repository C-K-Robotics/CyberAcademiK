import type { ReactNode, CSSProperties } from 'react'
import { useMemo } from 'react'

/** Parse inline markdown into an array of JSX elements. */
const TOKEN_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g

function parseInlineMarkdown(text: string): ReactNode[] {
  const tokens: ReactNode[] = []
  let pos = 0
  let m: RegExpExecArray | null

  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m.index > pos) {
      tokens.push(text.slice(pos, m.index))
    }

    const token = m[0]
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      // Bold: **text**
      tokens.push(<strong key={`b-${pos}`}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*') && token.endsWith('*') && token.length >= 3) {
      // Italic: *text*
      tokens.push(<em key={`i-${pos}`}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith('`') && token.endsWith('`') && token.length >= 3) {
      // Inline code: `text`
      tokens.push(
        <code
          key={`c-${pos}`}
          style={{
            fontFamily: "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace",
            fontSize: '0.88em',
            background: 'rgba(var(--ac1-rgb),0.1)',
            color: 'var(--ac1b)',
            padding: '1px 6px',
            borderRadius: 5,
          }}
        >
          {token.slice(1, -1)}
        </code>,
      )
    }
    pos = TOKEN_RE.lastIndex
  }

  if (pos < text.length) {
    tokens.push(text.slice(pos))
  }

  return tokens
}

interface Props {
  content: string
  style?: React.CSSProperties
}

/** Inline JSX wrapper that parses markdown in a string (bold, italic, inline code). */
export function InlineMarkdownText({ content, style }: Props) {
  const parsed = useMemo(() => parseInlineMarkdown(content), [content])
  return (
    <span style={style}>
      {parsed}
    </span>
  )
}

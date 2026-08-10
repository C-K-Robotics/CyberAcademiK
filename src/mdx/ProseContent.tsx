import { useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Bold / italic / inline-code spans. Deliberately small: this exists for strings
 * that never pass through the MDX compiler — YAML frontmatter (`lead`) and quiz
 * text — so lesson authors can use the same inline syntax everywhere. Anything
 * richer belongs in MDX, which has a real markdown parser.
 */
const TOKEN_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g

const codeStyle: CSSProperties = {
  fontFamily: "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace",
  fontSize: '0.88em',
  background: 'rgba(var(--ac1-rgb),0.1)',
  color: 'var(--ac1b)',
  padding: '1px 6px',
  borderRadius: 5,
}

function parseInlineMarkdown(text: string): ReactNode[] {
  const tokens: ReactNode[] = []
  let pos = 0
  let m: RegExpExecArray | null

  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m.index > pos) tokens.push(text.slice(pos, m.index))

    const token = m[0]
    const key = m.index
    if (token.startsWith('**')) {
      tokens.push(<strong key={`b-${key}`}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      tokens.push(<em key={`i-${key}`}>{token.slice(1, -1)}</em>)
    } else {
      tokens.push(
        <code key={`c-${key}`} style={codeStyle}>
          {token.slice(1, -1)}
        </code>,
      )
    }
    pos = TOKEN_RE.lastIndex
  }

  if (pos < text.length) tokens.push(text.slice(pos))

  return tokens
}

interface Props {
  content: string
  style?: CSSProperties
}

/** Inline JSX wrapper that parses markdown in a string (bold, italic, inline code). */
export function InlineMarkdownText({ content, style }: Props) {
  const parsed = useMemo(() => parseInlineMarkdown(content), [content])
  return <span style={style}>{parsed}</span>
}

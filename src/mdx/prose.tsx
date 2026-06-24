import type { MDXComponents } from 'mdx/types'
import type { CSSProperties, HTMLAttributes } from 'react'

const mono = "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace"

const pStyle: CSSProperties = {
  fontSize: 15.5,
  lineHeight: 1.65,
  color: 'var(--tx-2)',
  margin: '0 0 18px',
  maxWidth: 720,
}

const preStyle: CSSProperties = {
  margin: '8px 0',
  padding: '18px 20px',
  background: 'var(--bg-hero)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  overflowX: 'auto',
  fontFamily: mono,
  fontSize: 12.5,
  lineHeight: 1.7,
  color: 'var(--tx-1)',
  whiteSpace: 'pre',
}

const inlineCodeStyle: CSSProperties = {
  fontFamily: mono,
  fontSize: '0.88em',
  background: 'rgba(var(--ac1-rgb),0.1)',
  color: 'var(--ac1b)',
  padding: '1px 6px',
  borderRadius: 5,
}

/** Styled overrides for plain markdown elements inside lesson prose. */
export const proseComponents: MDXComponents = {
  p: (props) => <p {...props} style={pStyle} />,
  h2: (props) => (
    <h2
      {...props}
      style={{
        fontSize: 24,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        margin: '38px 0 12px',
        color: 'var(--tx-strong)',
      }}
    />
  ),
  h3: (props) => (
    <h3
      {...props}
      style={{ fontSize: 18, fontWeight: 600, margin: '26px 0 10px', color: 'var(--tx-strong)' }}
    />
  ),
  h4: (props) => (
    <h4
      {...props}
      style={{ fontSize: 14.5, fontWeight: 600, margin: '20px 0 8px', color: 'var(--tx-1)' }}
    />
  ),
  strong: (props) => <strong {...props} style={{ color: 'var(--tx-bright)', fontWeight: 600 }} />,
  em: (props) => <em {...props} style={{ color: 'var(--tx-1)' }} />,
  ul: (props) => (
    <ul
      {...props}
      style={{
        margin: '0 0 18px',
        paddingLeft: 22,
        color: 'var(--tx-2)',
        fontSize: 15,
        lineHeight: 1.7,
        maxWidth: 720,
      }}
    />
  ),
  ol: (props) => (
    <ol
      {...props}
      style={{
        margin: '0 0 18px',
        paddingLeft: 22,
        color: 'var(--tx-2)',
        fontSize: 15,
        lineHeight: 1.7,
        maxWidth: 720,
      }}
    />
  ),
  li: (props) => <li {...props} style={{ margin: '4px 0' }} />,
  blockquote: (props) => (
    <blockquote
      {...props}
      style={{
        margin: '18px 0',
        padding: '4px 18px',
        borderLeft: '3px solid var(--ac1)',
        color: 'var(--tx-2)',
        fontStyle: 'italic',
      }}
    />
  ),
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '28px 0' }} />,
  pre: (props) => <pre {...props} style={preStyle} />,
  code: (props: HTMLAttributes<HTMLElement> & { className?: string }) => {
    // Fenced code blocks carry a language-* class; leave their styling to <pre>.
    if (props.className?.includes('language-')) return <code {...props} />
    return <code {...props} style={inlineCodeStyle} />
  },
  table: (props) => (
    <div style={{ overflowX: 'auto', margin: '8px 0 18px' }}>
      <table
        {...props}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: mono,
          fontSize: 13.5,
          color: 'var(--tx-bright)',
        }}
      />
    </div>
  ),
  thead: (props) => <thead {...props} style={{ background: 'var(--bg-thead)' }} />,
  th: (props) => (
    <th
      {...props}
      style={{
        textAlign: 'left',
        padding: '12px 16px',
        fontSize: 11,
        letterSpacing: '0.06em',
        color: 'var(--tx-3)',
        fontWeight: 600,
        borderBottom: '1px solid var(--line)',
      }}
    />
  ),
  td: (props) => (
    <td {...props} style={{ padding: '12px 16px', borderTop: '1px solid var(--line)' }} />
  ),
}

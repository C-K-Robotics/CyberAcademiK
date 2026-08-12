---
type: mdx-prose-components
title: MDX Prose Components
description: Styled overrides for standard markdown elements (paragraphs, headings, code, pre, images, tables, blockquotes) rendered inside lesson content.
tags: [mdx, prose, styling, markdown, typography]
---

# MDX Prose Components

The prose components layer provides styled overrides for standard Markdown elements rendered inside lesson content. Each override is an MDX component that wraps the default element with consistent CyberAcademiK typography and spacing.

## Component source (`src/mdx/prose.tsx`)

The prose components are merged into the generic MDX component set and applied inside `MDXProvider`:

```tsx
export const proseComponents: MDXComponents = {
  img: ({ src, alt, ...rest }) => {
    if (typeof src !== 'string' || !src) return null
    return <img {...rest} src={assetUrl(src)} alt={alt ?? ''} style={imgStyle} />
  },
  p: (props) => <p {...props} style={pStyle} />,
  h2: (props) => <h2 {...props} style={{ fontSize: 24, fontWeight: 600, margin: '38px 0 12px', color: 'var(--tx-strong)' }} />,
  h3: (props) => <h3 {...props} style={{ fontSize: 18, fontWeight: 600, margin: '26px 0 10px', color: 'var(--tx-strong)' }} />,
  h4: (props) => <h4 {...props} style={{ fontSize: 14.5, fontWeight: 600, margin: '20px 0 8px', color: 'var(--tx-1)' }} />,
  strong: (props) => <strong {...props} style={{ color: 'var(--tx-bright)', fontWeight: 600 }} />,
  // ... and more
}
```

## Style specifications

### Paragraph (`p`)

```ts
{ fontSize: 15.5, lineHeight: 1.65, color: 'var(--tx-2)', margin: '0 0 18px', maxWidth: 720 }
```

### Headings

| Tag | Size | Weight | Margin | Color |
|-----|------|--------|--------|-------|
| `h2` | 24px | 600 | 38px top, 12px bottom | `--tx-strong` |
| `h3` | 18px | 600 | 26px top, 10px bottom | `--tx-strong` |
| `h4` | 14.5px | 600 | 20px top, 8px bottom | `--tx-1` |

### Images (`img`)

```ts
{ maxWidth: '100%', height: 'auto', display: 'block', margin: '22px 0', borderRadius: 12, border: '1px solid var(--line)' }
```

Critical: the `img` component calls `assetUrl(src)` to resolve root-relative paths against the deploy base. Without this, images referencing `public/` files would have 404 URLs under `/CyberAcademiK/`.

### Code

**Inline code:**
```ts
{ fontFamily: "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace", fontSize: '0.88em', background: 'rgba(var(--ac1-rgb),0.1)', color: 'var(--ac1b)', padding: '1px 6px', borderRadius: 5 }
```

**Code blocks (`pre`):**
```ts
{ margin: '8px 0', padding: '18px 20px', background: 'var(--bg-hero)', border: '1px solid var(--line)', borderRadius: 12, overflowX: 'auto', fontFamily: mono, fontSize: 12.5, lineHeight: 1.7, color: 'var(--tx-1)', whiteSpace: 'pre' }
```

### Blockquote

```ts
{ borderLeft: '3px solid var(--accent)', padding: '12px 16px', margin: '20px 0', background: 'rgba(var(--ac1-rgb),0.05)', borderRadius: '0 8px 8px 0' }
```

### Lists

**Unordered (`ul`):**
```ts
{ paddingLeft: 24, margin: '12px 0 18px' }
```
Each list item has a custom bullet using `::before` pseudo-element with accent color.

**Ordered (`ol`):**
```ts
{ paddingLeft: 28, margin: '12px 0 18px', listStyle: 'decimal' }
```
Numbered list items use accent-colored numbers.

### Table

| Element | Style |
|---------|-------|
| Table container | `overflowX: 'auto'`, margin `12px 0 18px` |
| Table | `width: '100%'`, `borderCollapse: 'collapse'`, font-size 14px |
| Header cells | `background: 'var(--bg-thead)'`, `fontWeight: 600`, border bottom 2px |
| Body cells | Border bottom 1px, padding 10px 12px |
| Row hover | `background: 'rgba(var(--ac1-rgb),0.03)'` |

### Links in lesson prose

Defined in `src/mdx/mdx.css` rather than prose.tsx (since CSS hover effects need pseudo-selectors):

```css
.lesson-prose a {
  color: var(--ac1b);
  text-decoration: none;
  border-bottom: 1px solid rgba(var(--ac1-rgb), 0.35);
  transition: border-color 0.15s ease;
}
.lesson-prose a:hover {
  border-bottom-color: var(--ac1b);
}
```

### Inline markdown for non-MDX strings (`src/mdx/ProseContent.tsx`)

The `InlineMarkdownText` component parses bold/italic/inline-code in plain strings (YAML frontmatter values like `lead` or quiz text) that never pass through the MDX compiler:

```tsx
// Regex: matches **bold**, *italic*, `inline code`
const TOKEN_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
```

## Design principles

1. **Max-width 720px** on paragraphs for readability
2. **Accent color system** — inline code uses `--ac1` accent, blockquotes use accent borders
3. **Thematic colors** — headings use `--tx-strong` (adapts per theme), body text uses `--tx-2`
4. **Monospace everywhere** — code elements use IBM Plex Mono or system monospace
5. **Border radius 12px** on images and code blocks for visual consistency

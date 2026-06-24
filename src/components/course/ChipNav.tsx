import { useEffect, useRef, useState } from 'react'

interface Chip {
  id: string
  n: string
  label: string
}

/**
 * Section navigation that builds itself from the rendered <Section> elements
 * (data-section / data-n / data-chip) and highlights the section in view. Because
 * it discovers content at runtime, authors never maintain a separate nav list.
 *
 * The lesson body is lazily code-split per locale, so it mounts *after* this
 * component and re-mounts when the language changes. A one-shot scan would race
 * that and show stale (previous-locale) or empty chips. Instead we watch the
 * content subtree with a MutationObserver and rebuild whenever the rendered
 * sections actually change — so the chips always match the visible language.
 * `contentKey` (slug + locale) resets the scan when the lesson swaps.
 */
export function ChipNav({ contentKey }: { contentKey: string }) {
  const [chips, setChips] = useState<Chip[]>([])
  const [active, setActive] = useState('')
  const sigRef = useRef('')

  useEffect(() => {
    sigRef.current = '' // force a rebuild for the newly-selected lesson/locale
    let io: IntersectionObserver | null = null
    let timer = 0

    const scan = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'))
      const next: Chip[] = els.map((el) => ({
        id: el.dataset.section ?? '',
        n: el.dataset.n ?? '',
        label: el.dataset.chip ?? '',
      }))
      const sig = next.map((c) => `${c.id}|${c.n}|${c.label}`).join('~')
      if (sig === sigRef.current) return // nothing relevant changed (e.g. a widget re-rendered)
      sigRef.current = sig

      setChips(next)
      // Keep the highlighted section if it still exists (ids are stable across
      // locales); otherwise fall back to the first.
      setActive((cur) => (next.some((c) => c.id === cur) ? cur : next[0]?.id ?? ''))

      io?.disconnect()
      io = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          if (visible[0]) {
            const id = (visible[0].target as HTMLElement).dataset.section
            if (id) setActive(id)
          }
        },
        { rootMargin: '-120px 0px -65% 0px', threshold: 0 },
      )
      els.forEach((el) => io?.observe(el))
    }

    // Debounce rescans with a timer rather than requestAnimationFrame: rAF
    // callbacks are paused while the tab is hidden/backgrounded, so a lesson body
    // that mounts in a background tab would leave the chip bar empty until the
    // next paint (e.g. only after the user switches language or refocuses). A
    // timeout always fires, so the bar appears as soon as the sections exist.
    const schedule = () => {
      clearTimeout(timer)
      timer = window.setTimeout(scan, 0)
    }

    const target = document.querySelector('.course-content') ?? document.body
    const mo = new MutationObserver(schedule)
    mo.observe(target, { childList: true, subtree: true })
    scan() // initial pass for content already mounted (cached/fast loads)

    return () => {
      clearTimeout(timer)
      mo.disconnect()
      io?.disconnect()
    }
  }, [contentKey])

  const go = (id: string) => {
    const el = document.getElementById(`sec-${id}`)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 110
      window.scrollTo({ top, behavior: 'smooth' })
      setActive(id)
    }
  }

  if (chips.length === 0) return null

  return (
    <div
      className="course-chipnav"
      style={{
        position: 'sticky',
        top: 58,
        zIndex: 19,
        background: 'var(--bg-chipnav)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--line)',
        padding: '9px 28px',
        display: 'flex',
        gap: 7,
        overflowX: 'auto',
      }}
    >
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className="chip"
          data-active={active === chip.id}
          onClick={() => go(chip.id)}
        >
          {chip.n} · {chip.label}
        </button>
      ))}
    </div>
  )
}

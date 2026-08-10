import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/I18nProvider'

/** One navigable step: either a `<Slide>` block or a whole `<Section>`. */
interface SlideItem {
  /** The element shown for this step. */
  el: HTMLElement
  /** The `<Section>` the step lives in — always shown, so its heading stays put. */
  section: HTMLElement
  /** The section's display number, e.g. `"03"`. */
  n: string
  /** 1-based position of this step within its section. */
  index: number
  /** How many steps its section has. */
  total: number
  /** True when the step *is* the whole section (no `<Slide>` breaks inside). */
  isWholeSection: boolean
}

interface SlideDeckProps {
  /** Course slug — the saved position is per course. */
  slug: string
  onExit: () => void
}

const STORAGE_KEY = 'cyberacademik:slide-mode'
/** Give up polling for the lazily-mounted lesson body after ~100 frames (~1.5s). */
const MAX_SCAN_FRAMES = 100

function readSavedIdx(slug: string): number {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    const idx = Number(saved?.[slug])
    return Number.isInteger(idx) && idx >= 0 ? idx : 0
  } catch {
    return 0
  }
}

function writeSavedIdx(slug: string, idx: number) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, [slug]: idx }))
  } catch {
    /* private mode or quota — the saved position is a convenience, not state we need */
  }
}

/**
 * Build the slide list from the rendered lesson: every `<Slide>` inside a
 * `<Section>` is a step, and a section with no `<Slide>` breaks is one step on
 * its own. Nothing is registered up front — authors only add `<Slide>` markers.
 */
function collectSlides(): SlideItem[] {
  const out: SlideItem[] = []

  document.querySelectorAll<HTMLElement>('.lesson-prose [data-section]').forEach((section) => {
    const n = section.dataset.n ?? ''
    const breaks = section.querySelectorAll<HTMLElement>('[data-slide]')

    if (breaks.length === 0) {
      out.push({ el: section, section, n, index: 1, total: 1, isWholeSection: true })
      return
    }
    breaks.forEach((el, i) => {
      out.push({ el, section, n, index: i + 1, total: breaks.length, isWholeSection: false })
    })
  })

  return out
}

/** Show only `slides[idx]` (and the section it belongs to); hide every other step. */
function showOnly(slides: SlideItem[], idx: number) {
  for (const s of slides) {
    s.section.style.display = 'none'
    if (!s.isWholeSection) s.el.style.display = 'none'
  }

  const target = slides[idx]
  if (!target) return
  target.section.style.display = ''
  target.el.style.display = ''
  target.section.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Undo `showOnly` so the lesson reads as a normal scrolling page again. */
function restoreAll(slides: SlideItem[]) {
  for (const s of slides) {
    s.section.style.display = ''
    s.el.style.display = ''
  }
}

/** True while the user is typing, so slide keys must not steal the keystroke. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

/**
 * Slide-mode controller: a floating prev/next bar that walks the lesson one
 * `<Slide>` (or `<Section>`) at a time.
 *
 * The steps are discovered from the DOM rather than passed in, because the
 * lesson body is lazily code-split MDX that mounts *after* this component — the
 * same reason ChipNav scans instead of taking a list. Visibility is applied as
 * inline `display` and undone by the effect cleanup, so leaving slide mode (or
 * unmounting for any other reason) always restores the page.
 */
export function SlideDeck({ slug, onExit }: SlideDeckProps) {
  const { t } = useI18n()
  const [slides, setSlides] = useState<SlideItem[]>([])
  const [activeIdx, setActiveIdx] = useState(() => readSavedIdx(slug))

  const count = slides.length
  const ready = count > 0

  // Discover the steps, retrying until the lazy lesson body has mounted, then
  // keep watching: the body re-mounts when the locale changes, which would
  // otherwise leave us holding detached elements.
  useEffect(() => {
    let frame = 0
    let timer = 0
    let attempts = 0
    let current: SlideItem[] = []

    const unchanged = (next: SlideItem[]) =>
      next.length === current.length && next.every((s, i) => s.el === current[i].el)

    const scan = () => {
      const found = collectSlides()
      if (found.length === 0) {
        if (attempts++ < MAX_SCAN_FRAMES) frame = requestAnimationFrame(scan)
        return
      }
      attempts = 0
      if (unchanged(found)) return
      current = found
      setSlides(found)
    }

    const schedule = () => {
      clearTimeout(timer)
      timer = window.setTimeout(scan, 0)
    }

    const target = document.querySelector('.course-content') ?? document.body
    const mo = new MutationObserver(schedule)
    mo.observe(target, { childList: true, subtree: true })
    scan()

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      mo.disconnect()
    }
  }, [])

  // A saved position can outlive the lesson it came from (edited content, or a
  // locale with fewer sections), so clamp it rather than land on nothing.
  useEffect(() => {
    if (count > 0) setActiveIdx((i) => Math.min(i, count - 1))
  }, [count])

  useEffect(() => {
    if (count > 0) writeSavedIdx(slug, activeIdx)
  }, [slug, activeIdx, count])

  // Apply visibility; the cleanup restores it, which is also what makes exiting
  // slide mode (this component unmounting) leave the page in a readable state.
  useEffect(() => {
    if (slides.length === 0) return
    showOnly(slides, activeIdx)
    return () => restoreAll(slides)
  }, [slides, activeIdx])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(count - 1, i + 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(0, i - 1))
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onExit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, onExit])

  const hasPrev = activeIdx > 0
  const hasNext = activeIdx < count - 1

  const active = slides[activeIdx]
  const sectionCount = new Set(slides.map((s) => s.n)).size
  let label = `${activeIdx + 1} / ${count}`
  if (active) {
    label = active.isWholeSection
      ? `${Number(active.n)} / ${sectionCount}`
      : `${Number(active.n)}.${active.index} / ${Number(active.n)}.${active.total}`
  }

  const stepButton = (dir: -1 | 1, enabled: boolean, title: string, glyph: string) => (
    <button
      type="button"
      onClick={() => setActiveIdx((i) => Math.min(count - 1, Math.max(0, i + dir)))}
      disabled={!enabled}
      title={title}
      aria-label={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        background: 'var(--bg-panel)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        cursor: enabled ? 'pointer' : 'default',
        color: 'var(--tx-2)',
        fontSize: 16,
        opacity: enabled ? 1 : 0.35,
      }}
    >
      {glyph}
    </button>
  )

  return (
    <nav className="slide-deck" style={{ opacity: ready ? 1 : 0.25 }} aria-label={t.slideMode}>
      {stepButton(-1, hasPrev, t.slidePrev, '←')}
      <span style={{ padding: '0 4px' }}>{ready ? label : '…'}</span>
      {stepButton(1, hasNext, t.slideNext, '→')}
      <div style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 4px' }} />
      <button
        type="button"
        onClick={onExit}
        title={t.slideExit}
        aria-label={t.slideExit}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          fontFamily: 'inherit',
          fontSize: 14,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--tx-2)',
        }}
      >
        ✕
      </button>
    </nav>
  )
}

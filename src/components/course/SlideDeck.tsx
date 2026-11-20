import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  /** Opt-in reveals in reading order. */
  reveals: HTMLElement[]
}

interface SlidePosition {
  index: number
  revealed: number
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
    const current = localStorage.getItem(`${STORAGE_KEY}:${slug}`)
    const saved = current === null
      ? (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>)?.[slug]
      : current
    const idx = Number(saved)
    return Number.isInteger(idx) && idx >= 0 ? idx : 0
  } catch {
    return 0
  }
}

function writeSavedIdx(slug: string, idx: number) {
  try {
    localStorage.setItem(`${STORAGE_KEY}:${slug}`, String(idx))
  } catch {
    /* private mode or quota — the saved position is a convenience, not state we need */
  }
}

/** Treat a sole Reveal inside a list item as the whole bullet, including its marker. */
function soleParent(el: HTMLElement, tag: string) {
  const parent = el.parentElement
  if (parent?.tagName !== tag) return undefined
  const isSoleChild = Array.from(parent.childNodes).every((node) =>
    node === el || node.nodeType === Node.COMMENT_NODE ||
    (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()),
  )
  return isSoleChild ? parent : undefined
}

function collectReveals(slide: HTMLElement): HTMLElement[] {
  return Array.from(slide.querySelectorAll<HTMLElement>('[data-slide-reveal]'), (marker) => {
    const content = soleParent(marker, 'P') ?? marker
    return soleParent(content, 'LI') ?? marker
  })
}

/**
 * Build the slide list from the rendered lesson: every `<Slide>` inside a
 * `<Section>` is a slide, and a section with no `<Slide>` breaks is one slide on
 * its own. A slide can have zero or more `<Reveal>` markers.
 */
function collectSlides(): SlideItem[] {
  const out: SlideItem[] = []

  document.querySelectorAll<HTMLElement>('.lesson-prose [data-section]').forEach((section) => {
    const n = section.dataset.n ?? ''
    const breaks = section.querySelectorAll<HTMLElement>('[data-slide]')

    if (breaks.length === 0) {
      out.push({ el: section, section, n, index: 1, total: 1, isWholeSection: true, reveals: collectReveals(section) })
      return
    }
    breaks.forEach((el, i) => {
      out.push({ el, section, n, index: i + 1, total: breaks.length, isWholeSection: false, reveals: collectReveals(el) })
    })
  })

  return out
}

function slideScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
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
  target.section.scrollIntoView({ behavior: slideScrollBehavior(), block: 'start' })
}

/** Undo `showOnly` so the lesson reads as a normal scrolling page again. */
function restoreAll(slides: SlideItem[]) {
  for (const s of slides) {
    s.section.style.display = ''
    s.el.style.display = ''
  }
}

function clampPosition(slides: SlideItem[], position: SlidePosition): SlidePosition {
  if (slides.length === 0) return position
  const index = Math.min(position.index, slides.length - 1)
  const revealed = index === position.index ? Math.min(position.revealed, slides[index].reveals.length) : 0
  return index === position.index && revealed === position.revealed ? position : { index, revealed }
}

function move(slides: SlideItem[], position: SlidePosition, dir: -1 | 1): SlidePosition {
  if (slides.length === 0) return position
  const { index, revealed } = clampPosition(slides, position)

  if (dir === 1) {
    if (revealed < slides[index].reveals.length) return { index, revealed: revealed + 1 }
    if (index < slides.length - 1) return { index: index + 1, revealed: 0 }
  } else {
    if (revealed > 0) return { index, revealed: revealed - 1 }
    if (index > 0) return { index: index - 1, revealed: slides[index - 1].reveals.length }
  }

  return position
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
 * reveal or slide at a time.
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
  const [position, setPosition] = useState<SlidePosition>(() => ({ index: readSavedIdx(slug), revealed: 0 }))
  const previousReveal = useRef<{ slide?: SlideItem; count: number }>({ count: 0 })

  const count = slides.length
  const ready = count > 0
  const { index: activeIdx, revealed } = clampPosition(slides, position)
  const active = slides[activeIdx]

  const step = useCallback((dir: -1 | 1) => {
    setPosition((prev) => move(slides, prev, dir))
  }, [slides])

  // Discover the steps, retrying until the lazy lesson body has mounted, then
  // keep watching: the body re-mounts when the locale changes, which would
  // otherwise leave us holding detached elements.
  useEffect(() => {
    let frame = 0
    let timer = 0
    let attempts = 0
    let current: SlideItem[] = []

    const unchanged = (next: SlideItem[]) =>
      next.length === current.length && next.every((s, i) => {
        const prev = current[i]
        return s.el === prev.el && s.reveals.length === prev.reveals.length &&
          s.reveals.every((reveal, j) => reveal === prev.reveals[j])
      })

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

  // Clamp a saved or current position after edits or a locale change. Only the
  // slide index is persisted; reopening the deck starts its reveal steps over.
  useEffect(() => {
    setPosition((prev) => clampPosition(slides, prev))
  }, [slides])

  useEffect(() => {
    if (ready) writeSavedIdx(slug, activeIdx)
  }, [slug, activeIdx, ready])

  // Apply slide and reveal visibility before paint. Separate the reveal update
  // so advancing one sentence never repeats the slide's scroll-to-top behavior.
  useLayoutEffect(() => {
    if (!active) return
    showOnly(slides, activeIdx)
    return () => {
      restoreAll(slides)
      for (const el of active.reveals) delete el.dataset.slideRevealState
    }
  }, [slides, activeIdx, active])

  useLayoutEffect(() => {
    const previous = previousReveal.current
    previousReveal.current = { slide: active, count: revealed }
    active?.reveals.forEach((el, i) => {
      el.dataset.slideRevealState = i < revealed ? 'shown' : 'hidden'
    })
    if (active && previous.slide === active && revealed > previous.count) {
      active.reveals[revealed - 1].scrollIntoView({ behavior: slideScrollBehavior(), block: 'nearest' })
    }
  }, [active, revealed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return

      if (ready && (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown')) {
        e.preventDefault()
        step(1)
      } else if (ready && (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp')) {
        e.preventDefault()
        step(-1)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onExit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready, step, onExit])

  const canHide = revealed > 0
  const canReveal = revealed < (active?.reveals.length ?? 0)
  const hasPrev = ready && (canHide || activeIdx > 0)
  const hasNext = ready && (canReveal || activeIdx < count - 1)
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
      onClick={() => step(dir)}
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
      {stepButton(-1, hasPrev, canHide ? t.slideHideItem : t.slidePrev, '←')}
      <span style={{ padding: '0 4px' }}>{ready ? label : '…'}</span>
      {stepButton(1, hasNext, canReveal ? t.slideRevealItem : t.slideNext, '→')}
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

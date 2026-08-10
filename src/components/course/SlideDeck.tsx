import { useCallback, useEffect, useState, useRef } from 'react'

interface SlideItem {
  el: HTMLElement
  sectionId: string
  n: string
  breakIndex: number
  totalBreaks: number
  isSectionSlide: boolean
  contentLength?: number
}

interface SlideDeckProps {
  onExit: () => void
}

/** Restores the inline display style on the given elements. */
export function exitAll(sec: HTMLElement[]) {
  sec.forEach((el) => { el.style.display = '' })
}

function getSavedIdx(): number {
  try {
    const saved = JSON.parse(localStorage.getItem('cyberacademik:slide-mode') ?? '{}')
    return (saved as { idx?: number })?.idx ?? 0
  } catch {
    return 0
  }
}

/**
 * Scan DOM for [data-slide] elements inside sections (polls until content mounts).
 * If no [data-slide] elements exist, falls back to [data-section] (current v1 default).
 */
function collectSlides(): SlideItem[] {
  const sections = document.querySelectorAll<HTMLElement>('.lesson-prose [data-section]')
  const result: SlideItem[] = []

  for (const section of sections) {
    const breaks = section.querySelectorAll<HTMLElement>('[data-slide]')

    if (breaks.length > 0) {
      breaks.forEach((el) => {
        const idx = [...breaks].indexOf(el) + 1
        result.push({
          el,
          sectionId: section.dataset.section ?? '',
          n: section.dataset.n ?? '',
          breakIndex: idx,
          totalBreaks: breaks.length,
          isSectionSlide: false,
          contentLength: el.children.length,
        })
      })
    } else {
      result.push({
        el: section,
        sectionId: section.dataset.section ?? '',
        n: section.dataset.n ?? '',
        breakIndex: 0,
        totalBreaks: 0,
        isSectionSlide: true,
        contentLength: section.children.length,
      })
    }
  }

  return result
}

export function SlideDeck({ onExit }: SlideDeckProps) {
  // All refs — values that persist across renders and can be mutated.
  const slidesRef = useRef<SlideItem[]>([])
  const slideCountRef = useRef(0)
  const activeIdxRef = useRef(0)

  // State — values that trigger re-renders.
  const [ready, setReady] = useState(false)
  const [activeIdx, setActiveIdx] = useState(getSavedIdx)

  useEffect(() => {
    let cancelled = false

    const scan = () => {
      if (cancelled) return

      const found = collectSlides()

      if (found.length === 0) {
        // Content not loaded yet — retry, but stop after 100 attempts to avoid infinite loop
        if (activeIdxRef.current < 100) {
          activeIdxRef.current++
          requestAnimationFrame(scan)
        }
        return
      }

      slidesRef.current = found
      slideCountRef.current = found.length
      setReady(true)
    }

    scan()

    // When this component unmounts, restore all sections so normal scroll mode works.
    return () => {
      cancelled = true
      exitAll(slidesRef.current.map((s) => s.el))
      document.querySelectorAll('[data-section]').forEach((el) => {
        ;(el as HTMLElement).style.display = ''
      })
    }
  }, [])

  // Restore index from localStorage when slides are first found
  useEffect(() => {
    if (slidesRef.current.length === 0) return
    const saved = JSON.parse(localStorage.getItem('cyberacademik:slide-mode') ?? '{}')
    const idx = (saved as { idx?: number })?.idx ?? 0
    if (idx < slidesRef.current.length) {
      setActiveIdx(idx)
    }
  }, [ready])

  // Persist index to localStorage
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem('cyberacademik:slide-mode', JSON.stringify({ idx: activeIdx }))
      } catch { /* silently ignore */ }
    }
  }, [activeIdx, ready])

  // Hide all except current slide, show only the active section's title.
  // Guarded by slideCountRef (goes to 0 on unmount via cleanup) and the DOM check
  // to bail when exiting slide mode — preventing the hide effect from re-hiding
  // sections that were just restored by the cleanup effect or handleExit.
  useEffect(() => {
    if (slideCountRef.current === 0) return
    if (slidesRef.current.length === 0) return
    // When SlideDeck unmounts, data-slide-mode is removed from .course-main —
    // bail silently, the cleanup effect has already restored the sections.
    if (document.querySelector('.course-main[data-slide-mode]') === null) return
    document.querySelectorAll('[data-section]').forEach((el) => { el.style.display = 'none' })
    slidesRef.current.forEach((s) => { s.el.style.display = 'none' })
    const target = slidesRef.current[activeIdx]
    if (target) {
      target.el.style.display = ''
      target.el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      let parent = target.el.parentElement
      while (parent) {
        if (parent.dataset.section !== undefined) {
          parent.style.display = ''
          break
        }
        parent = parent.parentElement
      }
    }
  }, [activeIdx, ready])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(slidesRef.current.length - 1, i + 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(0, i - 1))
      } else if (e.key === 'Escape') {
        ;(window as Record<string, unknown>).__slideExit?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Central exit handler: restore all sections before signaling exit.
  const handleExit = useCallback(() => {
    exitAll(slidesRef.current.map((s) => s.el))
    document.querySelectorAll('[data-section]').forEach((el) => {
      ;(el as HTMLElement).style.display = ''
    })
    onExit()
    window.location.hash = ''
  }, [onExit])

  // Expose exit function globally (for keyboard handler)
  useEffect(() => {
    ;(window as Record<string, unknown>).__slideExit = handleExit
    return () => { delete (window as Record<string, unknown>).__slideExit }
  }, [handleExit])

  const prev = activeIdx > 0
  const next = activeIdx < slidesRef.current.length - 1
  const total = new Set(slidesRef.current.map((s) => s.n)).size

  // Generate nav label
  let navLabel = `${activeIdx + 1} / ${total}`
  const activeSlide = slidesRef.current[activeIdx]
  if (activeSlide) {
    if (!activeSlide.isSectionSlide) {
      // Break slide: "3 / 2" (no leading zeros, "pillars 1-3" / "pillars 4-5")
      navLabel = `${Number(activeSlide.n)}.${activeSlide.breakIndex} / ${Number(activeSlide.n)}.${activeSlide.totalBreaks}`
    } else {
      // Section slide: show "N / total"
      navLabel = `${Number(activeSlide.n)} / ${total}`
    }
  }

  return (
    <nav
      className="slide-deck"
      style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, opacity: ready ? 1 : 0.25, transition: 'opacity 0.2s' }}
      aria-label="Slide mode"
    >
      <button
        type="button"
        onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
        disabled={!prev}
        title="Previous slide"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, background: 'var(--bg-panel)',
          border: '1px solid var(--line)', borderRadius: 8,
          cursor: prev ? 'pointer' : 'default', color: 'var(--tx-2)',
          fontSize: 16, opacity: prev ? 1 : 0.35,
        }}
      >
        ←
      </button>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--tx-2)', padding: '0 4px' }}>
        {ready ? navLabel : '…'}
      </span>
      <button
        type="button"
        onClick={() => setActiveIdx((i) => Math.min(slidesRef.current.length - 1, i + 1))}
        disabled={!next}
        title="Next slide"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, background: 'var(--bg-panel)',
          border: '1px solid var(--line)', borderRadius: 8,
          cursor: next ? 'pointer' : 'default', color: 'var(--tx-2)',
          fontSize: 16, opacity: next ? 1 : 0.35,
        }}
      >
        →
      </button>
      <div style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 4px' }} />
      <button
        type="button"
        onClick={handleExit}
        title="Exit slide mode"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, fontFamily: 'inherit', fontSize: 14,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--tx-2)',
        }}
      >
        ✕
      </button>
    </nav>
  )
}

import { useEffect, useRef, useState } from 'react'

interface SlideDeckProps {
  onExit: () => void
}

function exitAll(sec: HTMLElement[]) {
  sec.forEach((el) => { el.style.display = '' })
}

function getSavedIdx(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const saved = JSON.parse(localStorage.getItem('cyberacademik:slide-mode') ?? '{}')
    return (saved as { idx?: number })?.idx ?? 0
  } catch {
    return 0
  }
}

export function SlideDeck({ onExit }: SlideDeckProps) {
  const sectionsRef = useRef<HTMLElement[]>([])
  const [ready, setReady] = useState(false)
  const [activeIdx, setActiveIdx] = useState(getSavedIdx)

  // On mount: scan DOM for section elements (polls until content mounts).
  useEffect(() => {
    let cancelled = false

    const scan = () => {
      if (cancelled) return
      const found = Array.from(
        document.querySelectorAll<HTMLElement>('.lesson-prose [data-section]'),
      )
      if (found.length === 0) {
        requestAnimationFrame(scan)
        return
      }
      sectionsRef.current = found
      setReady(true)
    }

    requestAnimationFrame(scan)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-function-type
    return () => { cancelled = true }
  }, [])

  // Persist index to localStorage after first render (not on mount)
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem('cyberacademik:slide-mode', JSON.stringify({ idx: activeIdx })) } catch { /* silently ignore */ } }, 0)
    return () => clearTimeout(t)
  }, [activeIdx])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(sectionsRef.current.length - 1, i + 1))
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

  // Expose exit function globally (for keyboard handler)
  useEffect(() => {
    (window as Record<string, unknown>).__slideExit = () => {
      exitAll(sectionsRef.current)
      onExit()
      window.location.hash = ''
    }
    // Explicit no-op to avoid devtools trying to call the cleanup's return value
    return () => { delete (window as Record<string, unknown>).__slideExit; return undefined }
  }, [onExit])

  // Hide all except current section (after initial mount + index restore)
  useEffect(() => {
    if (sectionsRef.current.length === 0) return
    sectionsRef.current.forEach((el) => { el.style.display = 'none' })
    const target = sectionsRef.current[activeIdx]
    if (target) {
      target.style.display = ''
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeIdx, sectionsRef.current.length])

  // Cleanup on unmount: always restore all sections
  useEffect(() => {
    return () => { exitAll(sectionsRef.current) }
  }, [])

  const prev = activeIdx > 0
  const next = activeIdx < sectionsRef.current.length - 1
  const total = sectionsRef.current.length

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
        title="Previous section"
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
        {ready ? `${activeIdx + 1} / ${total}` : '…'}
      </span>
      <button
        type="button"
        onClick={() => setActiveIdx((i) => Math.min(total - 1, i + 1))}
        disabled={!next}
        title="Next section"
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
        onClick={() => {
          exitAll(sectionsRef.current)
          onExit()
          window.location.hash = ''
        }}
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

import { useEffect, useRef } from 'react'

/**
 * Runs `callback(dtSeconds, timestamp)` once per animation frame while `active`.
 * `dtSeconds` is the wall-clock delta since the previous frame, clamped to a sane
 * range so a backgrounded tab doesn't produce a huge jump. The callback is kept in
 * a ref so changing it doesn't restart the loop.
 */
export function useRafLoop(
  callback: (dt: number, ts: number) => void,
  active = true,
): void {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!active) return
    let raf = 0
    let last: number | null = null
    const tick = (ts: number) => {
      if (last == null) last = ts
      let dt = (ts - last) / 1000
      last = ts
      dt = Math.max(0.0005, Math.min(dt, 0.05))
      cbRef.current(dt, ts)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
}

/** Calls `fn` whenever the window resizes (debounced to a frame). */
export function useOnResize(fn: () => void): void {
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    let raf = 0
    const handler = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => fnRef.current())
    }
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('resize', handler)
      cancelAnimationFrame(raf)
    }
  }, [])
}

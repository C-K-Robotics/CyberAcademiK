/** Sizes a canvas for the device pixel ratio and returns a ready-to-draw context. */
export interface HiDPICanvas {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
}

export function setupHiDPICanvas(canvas: HTMLCanvasElement): HiDPICanvas | null {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = canvas.clientWidth || 300
  const height = canvas.clientHeight || 200
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  return { ctx, width, height }
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

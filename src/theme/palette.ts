import { useTheme, type ThemeName } from './ThemeProvider'

/**
 * Colours for <canvas>/SVG widgets. CSS custom properties can't be read by the
 * canvas 2D context cheaply, so we mirror the accent + neutral values here, keyed
 * by theme. Accents stay perceptually matched to theme.css. Use via usePalette().
 */
export interface Palette {
  label: string
  axis: string
  grid: string
  track: string
  strong: string
  dim: string
  tick: string
  setpoint: string
  baseline: string
  ac1: string
  ac3: string
  ac4: string
  ac5: string
  ac2line: string
  glow1: string
  glow1soft: string
  band: string
  arc: string
  goalGhost: string
  goalLine: string
  velZero: string
  massBg: string
  pivotBg: string
}

const LIGHT: Palette = {
  label: '#556470',
  axis: '#64727e',
  grid: 'rgba(70,95,125,0.12)',
  track: '#aebac4',
  strong: '#15232c',
  dim: '#41515d',
  tick: '#7a8794',
  setpoint: 'rgba(70,95,125,0.85)',
  baseline: 'rgba(70,95,125,0.4)',
  ac1: '#0a7d8f',
  ac3: '#c43e74',
  ac4: '#0e9d63',
  ac5: '#d23048',
  ac2line: 'rgba(107,70,193,0.5)',
  glow1: 'rgba(10,125,143,0.35)',
  glow1soft: 'rgba(10,125,143,0.22)',
  band: 'rgba(10,125,143,0.08)',
  arc: 'rgba(10,125,143,0.6)',
  goalGhost: 'rgba(14,157,99,0.5)',
  goalLine: 'rgba(14,157,99,0.85)',
  velZero: 'rgba(196,62,116,0.18)',
  massBg: '#d3e6ea',
  pivotBg: '#bcc8d2',
}

const DARK: Palette = {
  label: '#7c8a99',
  axis: '#566273',
  grid: 'rgba(86,130,170,0.10)',
  track: '#1b2531',
  strong: '#e6edf3',
  dim: '#9fb0c2',
  tick: '#54677b',
  setpoint: 'rgba(140,155,176,0.75)',
  baseline: 'rgba(86,130,170,0.35)',
  ac1: '#34d6e8',
  ac3: '#fb7bb5',
  ac4: '#34d399',
  ac5: '#fb7185',
  ac2line: 'rgba(167,139,250,0.5)',
  glow1: 'rgba(52,214,232,0.6)',
  glow1soft: 'rgba(52,214,232,0.45)',
  band: 'rgba(52,214,232,0.07)',
  arc: 'rgba(52,214,232,0.55)',
  goalGhost: 'rgba(52,211,153,0.5)',
  goalLine: 'rgba(52,211,153,0.85)',
  velZero: 'rgba(251,123,181,0.18)',
  massBg: '#10202a',
  pivotBg: '#0a0d12',
}

export function getPalette(theme: ThemeName): Palette {
  return theme === 'light' ? LIGHT : DARK
}

/** Returns the canvas palette for the active theme; re-renders on theme change. */
export function usePalette(): Palette {
  const { theme } = useTheme()
  return getPalette(theme)
}

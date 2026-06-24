import { useTheme } from '../../theme/ThemeProvider'
import logoLight from '../../assets/cyberpunk-logo.png'
import logoDark from '../../assets/cyberpunk-logo-dark.png'

interface BrandLogoProps {
  /** Rendered height of the wordmark in px; width scales to keep the aspect ratio. */
  height?: number
}

/**
 * The FRC#8020 "Cyberpunk" wordmark, as used in the Claude design. The artwork is
 * black text on transparent, so dark mode swaps to the inverted (white) version —
 * the red C/K accents are preserved in both. Matches the design's light/dark logo pair.
 */
export function BrandLogo({ height = 26 }: BrandLogoProps) {
  const { theme } = useTheme()
  return (
    <img
      src={theme === 'dark' ? logoDark : logoLight}
      alt="Cyberpunk"
      height={height}
      style={{ height, width: 'auto', display: 'block' }}
    />
  )
}

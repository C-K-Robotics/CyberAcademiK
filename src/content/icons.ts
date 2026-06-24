import {
  Hexagon,
  Zap,
  RefreshCw,
  Cpu,
  Wrench,
  Cog,
  Camera,
  CircuitBoard,
  Gauge,
  Code,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Maps the `icon` string in a category's _category.json to a Lucide component.
 * Add an entry here to make a new icon available to content managers.
 */
export const ICONS: Record<string, LucideIcon> = {
  Hexagon,
  Zap,
  RefreshCw,
  Cpu,
  Wrench,
  Cog,
  Camera,
  CircuitBoard,
  Gauge,
  Code,
}

export const FALLBACK_ICON: LucideIcon = RefreshCw

export function resolveIcon(name: string): LucideIcon {
  return ICONS[name] ?? FALLBACK_ICON
}

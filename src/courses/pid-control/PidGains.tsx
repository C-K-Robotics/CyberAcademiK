import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface PidGains {
  kp: number
  ki: number
  kd: number
}

interface PidGainsContextValue {
  gains: PidGains
  /** Merge a partial set of gains (slider drags, presets, Z–N apply). */
  setGains: (partial: Partial<PidGains>) => void
  /** Smoothly scroll the live simulator section into view. */
  scrollToSimulator: () => void
}

const PidGainsContext = createContext<PidGainsContextValue | null>(null)

/** DOM id of the live-simulator section (Section id="sim" -> "sec-sim"). */
export const SIMULATOR_SECTION_ID = 'sec-sim'

const DEFAULT_GAINS: PidGains = { kp: 120, ki: 160, kd: 14 }

export function PidGainsProvider({ children }: { children: ReactNode }) {
  const [gains, setGainsState] = useState<PidGains>(DEFAULT_GAINS)

  const setGains = useCallback((partial: Partial<PidGains>) => {
    setGainsState((g) => ({ ...g, ...partial }))
  }, [])

  const scrollToSimulator = useCallback(() => {
    const el = document.getElementById(SIMULATOR_SECTION_ID)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 110
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  const value = useMemo<PidGainsContextValue>(
    () => ({ gains, setGains, scrollToSimulator }),
    [gains, setGains, scrollToSimulator],
  )

  return <PidGainsContext.Provider value={value}>{children}</PidGainsContext.Provider>
}

/** Access the shared PID gains. Safe to call outside the provider (returns local fallback). */
export function usePidGains(): PidGainsContextValue {
  const ctx = useContext(PidGainsContext)
  if (!ctx) {
    throw new Error('usePidGains must be used within a PidGainsProvider')
  }
  return ctx
}

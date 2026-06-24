import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_LOCALE,
  LOCALES,
  STRINGS,
  type Locale,
  type Strings,
} from './strings'

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Strings
}

const I18nContext = createContext<I18nContextValue | null>(null)
const STORAGE_KEY = 'cyberacademik:locale'

function isLocale(value: string | null): value is Locale {
  return value != null && (LOCALES as readonly string[]).includes(value)
}

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (isLocale(stored)) return stored
  // Fall back to the browser's preference if it is Traditional Chinese.
  const nav = window.navigator?.language?.toLowerCase() ?? ''
  if (nav.startsWith('zh') && (nav.includes('hant') || nav.includes('tw') || nav.includes('hk'))) {
    return 'zh-Hant'
  }
  return DEFAULT_LOCALE
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale === 'zh-Hant' ? 'zh-Hant' : 'en'
    try {
      window.localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* ignore storage failure */
    }
  }, [locale])

  const setLocale = useCallback((l: Locale) => setLocaleState(l), [])

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: STRINGS[locale] }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}

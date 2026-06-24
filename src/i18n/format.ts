import type { Locale } from './strings'

/** "25 min" / "25 分鐘" */
export function formatMinutes(minutes: number, locale: Locale): string {
  return locale === 'zh-Hant' ? `${minutes} 分鐘` : `${minutes} min`
}

/** Two-digit lesson/course number, e.g. 3 -> "03". */
export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

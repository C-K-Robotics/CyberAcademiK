/**
 * Resolve a lesson asset path against the app's base URL.
 *
 * Course MDX points at files in `public/` with a root-relative path
 * (`/intro-to-robotics/ur5.png`), but the site is served from a sub-path on
 * GitHub Pages (`/CyberAcademiK/`), so those need the base prefixed. Already
 * complete URLs (`https://…`, `data:…`, protocol-relative `//…`) are passed
 * through untouched — prefixing those would break them.
 */
export function assetUrl(src: string): string {
  if (src.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(src)) return src
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return `${base}/${src.replace(/^\//, '')}`
}

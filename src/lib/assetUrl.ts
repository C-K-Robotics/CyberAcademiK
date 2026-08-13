/**
 * Resolve a lesson asset path against the app's base URL.
 *
 * Course MDX points at files in `public/` with a root-relative path
 * (`/intro-to-robotics/ur5.png`). That already matches the deployed root base
 * ('/'), but a sub-path build (`VITE_BASE=/CyberAcademiK/`) needs the base
 * prefixed. Already complete URLs (`https://…`, `data:…`, protocol-relative
 * `//…`) are passed through untouched — prefixing those would break them.
 */
export function assetUrl(src: string): string {
  if (src.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(src)) return src
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return `${base}/${src.replace(/^\//, '')}`
}

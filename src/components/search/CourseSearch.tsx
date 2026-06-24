import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import { searchCatalog, type SearchHit } from '../../content/selectors'
import { formatMinutes } from '../../i18n/format'
import type { Level } from '../../content/types'
import './CourseSearch.css'

interface CourseSearchProps {
  /** Visual context: the home topbar (sans, 240px) or the course topbar (mono, 200px). */
  variant?: 'home' | 'course'
}

function levelLabel(level: Level, t: ReturnType<typeof useI18n>['t']): string {
  return level === 'beginner' ? t.levelBeginner : level === 'advanced' ? t.levelAdvanced : t.levelIntermediate
}

function hitHref(hit: SearchHit): string {
  return hit.kind === 'course' ? `/courses/${hit.slug}` : `/subteams/${hit.id}`
}

/**
 * Live course/subteam search used in both topbars. Filters the discovered
 * catalog as you type, with keyboard navigation (↑/↓/↵/esc) and click-to-open.
 */
export function CourseSearch({ variant = 'home' }: CourseSearchProps) {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const results = useMemo(() => searchCatalog(query, locale), [query, locale])
  const showPanel = open && query.trim().length > 0

  // Restart the highlight whenever the result set changes.
  useEffect(() => setActive(0), [query, locale])

  // Keep the highlighted row visible while arrowing through a long list.
  useEffect(() => {
    if (showPanel) itemRefs.current[active]?.scrollIntoView({ block: 'nearest' })
  }, [active, showPanel])

  // Dismiss on any click outside the search.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function select(hit: SearchHit) {
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
    navigate(hitHref(hit))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (showPanel ? Math.min(i + 1, results.length - 1) : 0))
    } else if (e.key === 'ArrowUp' && showPanel) {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && showPanel && results[active]) {
      e.preventDefault()
      select(results[active])
    } else if (e.key === 'Escape') {
      if (query) setQuery('')
      else setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`ca-search ca-search--${variant}`} data-open={showPanel}>
      <Search size={14} color="var(--tx-4)" style={{ flex: 'none' }} />
      <input
        ref={inputRef}
        type="text"
        placeholder={t.searchPlaceholder}
        value={query}
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="ca-search-listbox"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
      />

      {showPanel && (
        <div className="ca-panel" id="ca-search-listbox" role="listbox">
          {results.length === 0 ? (
            <div className="ca-empty">{t.searchNoResults(query.trim())}</div>
          ) : (
            <>
              {results.map((hit, i) => {
                const accent = {
                  '--accent': `var(${hit.accent})`,
                  '--accent-rgb': `var(${hit.accentRgb})`,
                } as CSSProperties
                return (
                  <button
                    key={hit.kind === 'course' ? `c:${hit.slug}` : `s:${hit.id}`}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    data-active={i === active}
                    className="ca-item"
                    style={accent}
                    ref={(el) => {
                      itemRefs.current[i] = el
                    }}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(hit)}
                  >
                    <div className="ca-item-top">
                      <span className="ca-item-title">{hit.title}</span>
                      {hit.kind === 'subteam' && <span className="ca-tag">{t.searchSubteamTag}</span>}
                      {hit.kind === 'course' && hit.isNew && <span className="ca-tag ca-tag--new">{t.badgeNew}</span>}
                    </div>
                    <div className="ca-item-meta">
                      {hit.kind === 'course' ? (
                        <>
                          <span className="ca-item-ctx">{hit.subteamTitle}</span>
                          <span className="ca-sep">·</span>
                          <span>{levelLabel(hit.level, t)}</span>
                          <span>◷ {formatMinutes(hit.minutes, locale)}</span>
                        </>
                      ) : (
                        <span>{t.coursesCount(hit.courseCount)}</span>
                      )}
                    </div>
                  </button>
                )
              })}
              <div className="ca-hint">{t.searchHint}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

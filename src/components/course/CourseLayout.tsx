import { Fragment, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { Crosshair, Pencil, Trash2 } from 'lucide-react'
import './course.css'
import { CourseSidebar } from './CourseSidebar'
import { CourseTopbar } from './CourseTopbar'
import { SlideDeck } from './SlideDeck'
import { LectureOverlay } from './LectureOverlay'
import type { LectureTool } from './LectureCanvas'
import { ChipNav } from './ChipNav'
import { LessonHeader } from './LessonHeader'
import { CourseFooterNav } from './CourseFooterNav'
import { genericMdxComponents } from '../../mdx/components'
import { useI18n } from '../../i18n/I18nProvider'
import { findCourseEntry } from '../../content/selectors'
import { DEFAULT_LOCALE } from '../../i18n/strings'
import type { CourseModule } from '../../content/types'

function LoadingLesson() {
  return (
    <div
      style={{
        padding: '60px 0',
        textAlign: 'center',
        fontFamily: "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace",
        fontSize: 13,
        color: 'var(--tx-4)',
      }}
    >
      Loading lesson…
    </div>
  )
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

export function CourseLayout({ module }: { module: CourseModule }) {
  const { locale, t } = useI18n()
  const [navOpen, setNavOpen] = useState(false)
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [slideMode, setSlideMode] = useState(false)

  const [lectureMounted, setLectureMounted] = useState(false)
  const [lectureActive, setLectureActive] = useState(false)
  const [lectureTool, setLectureTool] = useState<LectureTool>('freedraw')
  const [toolRequestTick, setToolRequestTick] = useState(0)
  const [hasInk, setHasInk] = useState(false)
  const [clearTick, setClearTick] = useState(0)

  const drawBtnRef = useRef<HTMLButtonElement>(null)
  const anchorScrollYRef = useRef(0)
  const lastLocaleRef = useRef(locale)

  const meta = module.meta
  const subteam = findCourseEntry(meta.slug)?.subteam
  const components = useMemo(
    () => ({ ...genericMdxComponents, ...module.components }),
    [module],
  )

  // Pick this locale's content, falling back so a missing translation still renders.
  const loader =
    module.content[locale] ??
    module.content[DEFAULT_LOCALE] ??
    Object.values(module.content).find(Boolean)
  const Lazy = useMemo(() => (loader ? lazy(loader) : null), [loader])
  const Wrapper = module.Wrapper ?? Fragment

  const resetLecture = useCallback(() => {
    setLectureMounted(false)
    setLectureActive(false)
    setHasInk(false)
  }, [])

  const activateTool = useCallback((tool: LectureTool) => {
    setNavOpen(false)
    anchorScrollYRef.current = window.scrollY
    setLectureMounted(true)
    setLectureTool(tool)
    setToolRequestTick((n) => n + 1)
    setLectureActive(true)
  }, [])

  const toggleDraw = useCallback(() => {
    if (lectureActive) {
      setLectureActive(false)
    } else {
      activateTool('freedraw')
    }
  }, [lectureActive, activateTool])

  const activateLaser = useCallback(() => {
    activateTool('laser')
  }, [activateTool])

  const clearLecture = useCallback(() => {
    setClearTick((n) => n + 1)
  }, [])

  const handleInkChange = useCallback((next: boolean) => {
    if (next) anchorScrollYRef.current = window.scrollY
    setHasInk(next)
  }, [])

  const handleSlideChange = useCallback(() => {
    anchorScrollYRef.current = window.scrollY
    if (lectureMounted) setClearTick((n) => n + 1)
  }, [lectureMounted])

  // Updater functions must stay pure, so cross-state side effects are driven from the current
  // value in the handler rather than from inside a setState callback.
  const toggleNav = () => {
    if (window.matchMedia('(max-width:820px)').matches) {
      if (!navOpen) setLectureActive(false)
      setNavOpen(!navOpen)
    } else {
      setNavCollapsed((c) => !c)
    }
  }

  const exitSlide = useCallback(() => {
    resetLecture()
    setSlideMode(false)
  }, [resetLecture])

  const toggleSlide = () => {
    if (slideMode) exitSlide()
    else setSlideMode(true)
  }

  // Clear viewport-fixed annotations when switching locale mid-deck.
  useEffect(() => {
    if (lastLocaleRef.current === locale) return
    lastLocaleRef.current = locale
    if (lectureMounted) setClearTick((n) => n + 1)
  }, [locale, lectureMounted])

  // Clear annotations if the document scrolls underneath the fixed canvas. This must also run while
  // drawing: wheel/keys are blocked then, but the dock's reveal buttons still call scrollIntoView
  // on tall slides, which would leave the ink misaligned with the content it was drawn on.
  useEffect(() => {
    if (!slideMode || !lectureMounted || !hasInk) return
    const onScroll = () => {
      if (Math.abs(window.scrollY - anchorScrollYRef.current) > 8) {
        setClearTick((n) => n + 1)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [slideMode, lectureMounted, hasInk])

  // Alt+A toggles Annotate <-> Pass-through without colliding with Excalidraw single-key tools.
  useEffect(() => {
    if (!slideMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || !e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (e.code !== 'KeyA' || isEditableTarget(e.target)) return
      e.preventDefault()
      toggleDraw()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slideMode, toggleDraw])

  const lectureControls = (
    <>
      <button
        ref={drawBtnRef}
        type="button"
        className="slide-deck-btn"
        onClick={toggleDraw}
        title={lectureActive ? t.lecturePassThrough : t.lectureDraw}
        aria-label={lectureActive ? t.lecturePassThrough : t.lectureDraw}
        aria-pressed={lectureActive}
        data-lecture-control="draw"
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        className="slide-deck-btn"
        onClick={activateLaser}
        title={t.lectureLaser}
        aria-label={t.lectureLaser}
        data-lecture-control="laser"
      >
        <Crosshair size={15} />
      </button>
      <button
        type="button"
        className="slide-deck-btn"
        onClick={clearLecture}
        disabled={!hasInk}
        title={t.lectureClear}
        aria-label={t.lectureClear}
        data-lecture-control="clear"
      >
        <Trash2 size={15} />
      </button>
    </>
  )

  return (
    <div className="app-grid">
      <div
        className="course-overlay"
        data-open={navOpen}
        onClick={() => setNavOpen(false)}
        style={{ opacity: navOpen ? 1 : 0, pointerEvents: navOpen ? 'auto' : 'none' }}
      />

      <aside className="course-sidebar" data-open={navOpen} data-collapsed={navCollapsed}>
        <CourseSidebar meta={meta} onHome={() => setNavOpen(false)} />
      </aside>

      <main className="course-main" data-collapsed={navCollapsed} data-slide-mode={slideMode || undefined}>
        <CourseTopbar
          meta={meta}
          subteam={subteam}
          onToggleNav={toggleNav}
          slideMode={slideMode}
          onToggleSlide={toggleSlide}
        />
        {!slideMode && <ChipNav contentKey={`${meta.slug}:${locale}`} />}
        {slideMode && (
          <SlideDeck
            slug={meta.slug}
            onExit={exitSlide}
            suspendKeys={lectureActive}
            onSlideChange={handleSlideChange}
            lectureActive={lectureActive}
            extraControls={lectureControls}
          />
        )}

        <div
          className="course-content lesson-prose"
          style={{ maxWidth: 940, margin: '0 auto', padding: '44px 28px 120px' }}
        >
          {!slideMode && <LessonHeader meta={meta} />}
          <MDXProvider components={components}>
            <Wrapper>
              <Suspense fallback={<LoadingLesson />}>{Lazy ? <Lazy /> : null}</Suspense>
            </Wrapper>
          </MDXProvider>
          {!slideMode && <CourseFooterNav meta={meta} />}
        </div>
      </main>

      {slideMode && (
        <LectureOverlay
          mounted={lectureMounted}
          active={lectureActive}
          tool={lectureTool}
          toolRequestTick={toolRequestTick}
          clearTick={clearTick}
          returnFocusRef={drawBtnRef}
          onInkChange={handleInkChange}
        />
      )}
    </div>
  )
}

import { Fragment, Suspense, lazy, useMemo, useState } from 'react'
import { MDXProvider } from '@mdx-js/react'
import './course.css'
import { CourseSidebar } from './CourseSidebar'
import { CourseTopbar } from './CourseTopbar'
import { SlideDeck } from './SlideDeck'
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

export function CourseLayout({ module }: { module: CourseModule }) {
  const { locale } = useI18n()
  const [navOpen, setNavOpen] = useState(false)
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [slideMode, setSlideMode] = useState(false)

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

  const toggleNav = () => {
    if (window.matchMedia('(max-width:820px)').matches) setNavOpen((o) => !o)
    else setNavCollapsed((c) => !c)
  }

  const toggleSlide = () => setSlideMode((m) => !m)

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

      <main className="course-main" data-collapsed={navCollapsed} data-slide-mode={slideMode}>
        <CourseTopbar
          meta={meta}
          subteam={subteam}
          onToggleNav={toggleNav}
          slideMode={slideMode}
          onToggleSlide={toggleSlide}
        />
        {!slideMode && <ChipNav contentKey={`${meta.slug}:${locale}`} />}
        {slideMode && <SlideDeck onExit={toggleSlide} />}

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
    </div>
  )
}

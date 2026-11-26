import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../../theme/ThemeProvider'
import { useI18n } from '../../i18n/I18nProvider'
import type { LectureCanvasHandle, LectureTool } from './LectureCanvas'
import './lecture-overlay.css'

function createLazyCanvas() {
  return lazy(() => import('./LectureCanvas'))
}

interface LectureOverlayProps {
  /** Mounts the lazy Excalidraw chunk once true; remains mounted until slide mode exits. */
  mounted: boolean
  /** True while drawing (captures pointer/wheel/keys); false in pass-through mode. */
  active: boolean
  /** Tool requested by the dock (applied on mount and whenever toolRequestTick increments). */
  tool: LectureTool
  toolRequestTick: number
  /** Incrementing this counter clears the scene imperatively. */
  clearTick: number
  /** Focus returns here when switching from drawing back to pass-through. */
  returnFocusRef: RefObject<HTMLButtonElement>
  onInkChange: (hasInk: boolean) => void
}

interface ErrorBoundaryProps {
  errorLabel: string
  retryLabel: string
  onRetry: () => void
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class LectureErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Failure is surfaced cleanly via the retry pill so the lesson stays usable.
  }

  private handleRetry = () => {
    this.setState({ hasError: false })
    this.props.onRetry()
  }

  render() {
    if (this.state.hasError) {
      return createPortal(
        <div className="lecture-status-pill" role="alert">
          <span>{this.props.errorLabel}</span>
          <button type="button" onClick={this.handleRetry}>
            {this.props.retryLabel}
          </button>
        </div>,
        document.body,
      )
    }
    return this.props.children
  }
}

export function LectureOverlay({
  mounted,
  active,
  tool,
  toolRequestTick,
  clearTick,
  returnFocusRef,
  onInkChange,
}: LectureOverlayProps) {
  const { theme } = useTheme()
  const { t, locale } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<LectureCanvasHandle | null>(null)
  const wasActiveRef = useRef(false)
  const lastClearTickRef = useRef(clearTick)
  const lastToolTickRef = useRef(toolRequestTick)
  const [Canvas, setCanvas] = useState(createLazyCanvas)

  const activeRef = useRef(active)
  activeRef.current = active

  const focusEditor = useCallback(() => {
    const root = containerRef.current
    if (!root) return
    const editor = root.querySelector<HTMLElement>('.excalidraw[tabindex]') ?? root
    editor.focus({ preventScroll: true })
  }, [])

  const handleReady = useCallback(
    (handle: LectureCanvasHandle | null) => {
      handleRef.current = handle
      if (handle && activeRef.current) {
        focusEditor()
      }
    },
    [focusEditor],
  )

  const handleRetry = useCallback(() => {
    // Recreating the lazy wrapper discards React.lazy's cached rejection so import() retries.
    setCanvas(() => createLazyCanvas())
  }, [])

  // Keep the inactive overlay completely out of pointer and keyboard/tab reach.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.inert = !active
  }, [mounted, active])

  // Manage focus cleanly across drawing <-> pass-through transitions.
  useEffect(() => {
    if (!mounted) {
      wasActiveRef.current = false
      return
    }
    if (active && !wasActiveRef.current) {
      if (document.activeElement instanceof HTMLElement && !containerRef.current?.contains(document.activeElement)) {
        document.activeElement.blur()
      }
      focusEditor()
    } else if (!active && wasActiveRef.current) {
      returnFocusRef.current?.focus({ preventScroll: true })
    }
    wasActiveRef.current = active
  }, [mounted, active, returnFocusRef, focusEditor])

  // Block wheel / trackpad zoom-pan while drawing so ink stays aligned with the slide.
  useEffect(() => {
    if (!mounted || !active) return
    const el = containerRef.current
    if (!el) return

    const blockWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }
    el.addEventListener('wheel', blockWheel, { capture: true, passive: false })
    return () => el.removeEventListener('wheel', blockWheel, { capture: true })
  }, [mounted, active])

  // Clear scene on slide change, locale change, scroll drift, or explicit Clear click.
  useEffect(() => {
    if (clearTick === lastClearTickRef.current) return
    lastClearTickRef.current = clearTick
    handleRef.current?.clear()
  }, [clearTick])

  // Apply explicit dock tool switches (Draw vs Laser) when already mounted.
  useEffect(() => {
    if (toolRequestTick === lastToolTickRef.current) return
    lastToolTickRef.current = toolRequestTick
    handleRef.current?.setTool(tool)
  }, [tool, toolRequestTick])

  if (!mounted) return null

  const langCode = locale === 'zh-Hant' ? 'zh-TW' : 'en'

  return createPortal(
    <div
      ref={containerRef}
      className="lecture-overlay"
      data-active={String(active)}
      tabIndex={-1}
    >
      <LectureErrorBoundary
        errorLabel={t.lectureLoadError}
        retryLabel={t.lectureRetry}
        onRetry={handleRetry}
      >
        <Suspense
          fallback={createPortal(
            <div className="lecture-status-pill" role="status" aria-live="polite">
              {t.lectureLoading}
            </div>,
            document.body,
          )}
        >
          <Canvas
            theme={theme}
            langCode={langCode}
            initialTool={tool}
            onReady={handleReady}
            onInkChange={onInkChange}
          />
        </Suspense>
      </LectureErrorBoundary>
    </div>,
    document.body,
  )
}

import { useCallback, useEffect, useRef } from 'react'
import { CaptureUpdateAction, Excalidraw } from '@excalidraw/excalidraw'
import type { AppState, ExcalidrawImperativeAPI, NormalizedZoomValue } from '@excalidraw/excalidraw/types'
import '@excalidraw/excalidraw/index.css'
import type { ThemeName } from '../../theme/ThemeProvider'

export type LectureTool = 'freedraw' | 'laser'

export interface LectureCanvasHandle {
  clear: () => void
  setTool: (tool: LectureTool) => void
}

export interface LectureCanvasProps {
  theme: ThemeName
  langCode: string
  initialTool: LectureTool
  onReady: (handle: LectureCanvasHandle | null) => void
  onInkChange: (hasInk: boolean) => void
}

const TRANSPARENT_VIEWPORT = {
  viewBackgroundColor: 'transparent',
  scrollX: 0,
  scrollY: 0,
  zoom: { value: 1 as NormalizedZoomValue },
}

const UI_OPTIONS = {
  canvasActions: {
    export: false as const,
    loadScene: false,
    saveToActiveFile: false,
    saveAsImage: false,
    changeViewBackgroundColor: false,
    clearCanvas: false,
    toggleTheme: false,
  },
  tools: {
    image: false,
  },
}

/**
 * Lazy-loaded Excalidraw canvas. Kept in its own module so `@excalidraw/excalidraw`
 * and its stylesheet stay out of the main bundle until a presenter activates drawing.
 */
export default function LectureCanvas({
  theme,
  langCode,
  initialTool,
  onReady,
  onInkChange,
}: LectureCanvasProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const hasInkRef = useRef(false)
  // True once the presenter has touched the overlay themselves (see handleChange).
  const userInteractedRef = useRef(false)
  // The tool the dock last asked for (initialTool is the latest request, not just the first).
  const requestedToolRef = useRef(initialTool)
  const onReadyRef = useRef(onReady)
  const onInkChangeRef = useRef(onInkChange)

  requestedToolRef.current = initialTool
  onReadyRef.current = onReady
  onInkChangeRef.current = onInkChange

  // Excalidraw calls `excalidrawAPI` from inside its *constructor*, i.e. before the editor is
  // mounted, so any setState-backed call made here (setActiveTool, updateScene) is a silent no-op.
  // Only stash the API here.
  const handleApi = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api
  }, [])

  // Publish the handle from an effect rather than from handleApi: the effect re-runs on
  // StrictMode's simulated remount, whereas Excalidraw's constructor-time callback does not, so
  // publishing there left the handle null (Clear and tool switches dead) under `yarn dev`.
  useEffect(() => {
    onReadyRef.current({
      clear: () => {
        const api = apiRef.current
        if (!api) return
        // Drop only the elements. resetScene() would also reset the active tool, stroke colour
        // and width to defaults — and this runs on every slide change, so the presenter would
        // have to re-pick their pen each slide.
        api.updateScene({
          elements: [],
          appState: { selectedElementIds: {}, selectedGroupIds: {} },
          captureUpdate: CaptureUpdateAction.NEVER,
        })
        api.history.clear()
        if (hasInkRef.current) {
          hasInkRef.current = false
          onInkChangeRef.current(false)
        }
      },
      setTool: (tool: LectureTool) => {
        apiRef.current?.setActiveTool({ type: tool })
      },
    })
    return () => onReadyRef.current(null)
  }, [])

  const handleChange = useCallback((elements: readonly { isDeleted?: boolean }[], appState: AppState) => {
    // Excalidraw's async scene init (re-run by StrictMode's simulated remount in dev) re-applies
    // the default appState — i.e. the Selection tool — after we have set ours, and `laser` cannot
    // be restored through initialData at all. So keep re-asserting the requested tool on every
    // change until the presenter interacts with the overlay, after which their own toolbar
    // choices win. onChange never fires while Excalidraw is still loading.
    if (!userInteractedRef.current && appState.activeTool.type !== requestedToolRef.current) {
      apiRef.current?.setActiveTool({ type: requestedToolRef.current })
    }
    const nextHasInk = elements.some((el) => !el.isDeleted)
    if (nextHasInk !== hasInkRef.current) {
      hasInkRef.current = nextHasInk
      onInkChangeRef.current(nextHasInk)
    }
  }, [])

  const markInteracted = useCallback(() => {
    userInteractedRef.current = true
  }, [])

  // The early return is what terminates the snap-back: updateScene() re-fires onScrollChange with
  // zeros, which this bails on.
  const handleScrollChange = useCallback(
    (scrollX: number, scrollY: number, zoom: { value: NormalizedZoomValue }) => {
      if (scrollX === 0 && scrollY === 0 && zoom.value === 1) return
      apiRef.current?.updateScene({
        appState: {
          scrollX: 0,
          scrollY: 0,
          zoom: { value: 1 as NormalizedZoomValue },
        },
      })
    },
    [],
  )

  return (
    <div
      className="lecture-canvas-root"
      onPointerDownCapture={markInteracted}
      onKeyDownCapture={markInteracted}
    >
      <Excalidraw
        excalidrawAPI={handleApi}
        theme={theme}
        langCode={langCode}
        handleKeyboardGlobally={false}
        detectScroll={false}
        initialData={{
          appState: {
            ...TRANSPARENT_VIEWPORT,
            currentItemStrokeWidth: 2,
          },
        }}
        UIOptions={UI_OPTIONS}
        onChange={handleChange}
        onScrollChange={handleScrollChange}
      />
    </div>
  )
}

import { useCallback, useEffect, useRef } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI, NormalizedZoomValue } from '@excalidraw/excalidraw/types'
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
  const snappingRef = useRef(false)
  const initialToolRef = useRef(initialTool)
  const onReadyRef = useRef(onReady)
  const onInkChangeRef = useRef(onInkChange)

  initialToolRef.current = initialTool
  onReadyRef.current = onReady
  onInkChangeRef.current = onInkChange

  useEffect(() => {
    return () => {
      onReadyRef.current(null)
    }
  }, [])

  const handleApi = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api
    api.setActiveTool({ type: initialToolRef.current })

    onReadyRef.current({
      clear: () => {
        api.resetScene()
        // Raw resetScene() resets viewBackgroundColor to white — restore transparency.
        api.updateScene({ appState: TRANSPARENT_VIEWPORT })
        if (hasInkRef.current) {
          hasInkRef.current = false
          onInkChangeRef.current(false)
        }
      },
      setTool: (tool: LectureTool) => {
        api.setActiveTool({ type: tool })
      },
    })
  }, [])

  const handleChange = useCallback((elements: readonly { isDeleted?: boolean }[]) => {
    const nextHasInk = elements.some((el) => !el.isDeleted)
    if (nextHasInk !== hasInkRef.current) {
      hasInkRef.current = nextHasInk
      onInkChangeRef.current(nextHasInk)
    }
  }, [])

  const handleScrollChange = useCallback(
    (scrollX: number, scrollY: number, zoom: { value: NormalizedZoomValue }) => {
      if (snappingRef.current) return
      if (scrollX === 0 && scrollY === 0 && zoom.value === 1) return
      const api = apiRef.current
      if (!api) return
      snappingRef.current = true
      api.updateScene({
        appState: {
          scrollX: 0,
          scrollY: 0,
          zoom: { value: 1 as NormalizedZoomValue },
        },
      })
      snappingRef.current = false
    },
    [],
  )

  return (
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
  )
}

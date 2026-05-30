import { useRef, useCallback } from 'react'
import { useUiStore } from '../store/uiStore'

export function useSplitPane(containerRef: React.RefObject<HTMLDivElement | null>) {
  const setSplitRatio = useUiStore((s) => s.setSplitRatio)
  const dragging = useRef(false)

  const onDividerPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      dragging.current = true
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    []
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      setSplitRatio(ratio)
    },
    [containerRef, setSplitRatio]
  )

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return { onDividerPointerDown, onPointerMove, onPointerUp }
}

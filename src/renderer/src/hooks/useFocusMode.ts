import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

export function useFocusMode() {
  const toggleFocusMode = useUiStore((s) => s.toggleFocusMode)
  const focusMode = useUiStore((s) => s.focusMode)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        toggleFocusMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFocusMode])

  useEffect(() => {
    window.api.setFocusMode(focusMode)
  }, [focusMode])

  return focusMode
}

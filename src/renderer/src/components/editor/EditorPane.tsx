import './EditorPane.css'
import { useRef } from 'react'
import { useCodeMirror } from './useCodeMirror'
import { useUiStore } from '../../store/uiStore'

const PROSE_WIDTH_MAP: Record<string, string> = {
  narrow: '520px',
  default: '720px',
  wide: '960px',
  full: 'none'
}

export default function EditorPane() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorFontSize = useUiStore((s) => s.editorFontSize)
  const proseWidth = useUiStore((s) => s.proseWidth)
  useCodeMirror(containerRef)

  return (
    <div
      className="editor-pane"
      ref={containerRef}
      style={{
        '--editor-font-size': `${editorFontSize}px`,
        '--editor-prose-width': PROSE_WIDTH_MAP[proseWidth]
      } as React.CSSProperties}
    />
  )
}

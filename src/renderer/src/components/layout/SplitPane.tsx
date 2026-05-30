import './SplitPane.css'
import { useRef } from 'react'
import { useUiStore } from '../../store/uiStore'
import { useSplitPane } from '../../hooks/useSplitPane'
import EditorPane from '../editor/EditorPane'
import PreviewPane from '../preview/PreviewPane'

export default function SplitPane() {
  const splitRatio = useUiStore((s) => s.splitRatio)
  const focusMode = useUiStore((s) => s.focusMode)
  const previewVisible = useUiStore((s) => s.previewVisible)
  const containerRef = useRef<HTMLDivElement>(null)
  const { onDividerPointerDown, onPointerMove, onPointerUp } = useSplitPane(containerRef)

  const showPreview = previewVisible && !focusMode

  return (
    <div
      className="split-pane"
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="split-pane__editor"
        style={{ flex: showPreview ? `0 0 ${splitRatio * 100}%` : '1 1 100%' }}
      >
        <EditorPane />
      </div>
      {showPreview && (
        <>
          <div
            className="split-pane__divider"
            onPointerDown={onDividerPointerDown}
          />
          <div className="split-pane__preview">
            <PreviewPane />
          </div>
        </>
      )}
    </div>
  )
}

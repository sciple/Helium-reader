import './StatusBar.css'
import { useEditorStore } from '../../store/editorStore'

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function sentenceCount(text: string): number {
  const matches = text.match(/[.!?][\s\n]|[.!?]$/gm)
  return Math.max(1, matches?.length ?? 0)
}

function readingTime(text: string): string {
  const mins = Math.ceil(wordCount(text) / 200)
  return mins < 1 ? '< 1 min read' : `${mins} min read`
}

export default function StatusBar() {
  const content = useEditorStore((s) => s.content)
  const isDirty = useEditorStore((s) => s.isDirty)
  const currentFilePath = useEditorStore((s) => s.currentFilePath)
  const selectionSize = useEditorStore((s) => s.selectionSize)
  const selectedText = useEditorStore((s) => s.selectedText)

  const hasSelection = selectionSize > 0
  const words = wordCount(hasSelection ? selectedText : content)
  const chars = hasSelection ? selectionSize : content.length
  const sentences = hasSelection ? sentenceCount(selectedText) : null

  return (
    <div className="statusbar">
      <span className="statusbar__path">
        {currentFilePath ?? 'No file open'}
        {isDirty && <span className="statusbar__dirty"> ●</span>}
      </span>
      <span className="statusbar__stats">
        {words} words · {chars} chars
        {!hasSelection && <> · {readingTime(content)}</>}
        {sentences !== null && <> · ~{sentences} sentence{sentences !== 1 ? 's' : ''}</>}
      </span>
      {hasSelection && (
        <span className="statusbar__hint">
          <kbd>Ctrl+Shift+L</kbd> ask AI
          <span className="statusbar__hint-sep">·</span>
          <kbd>Ctrl+Shift+T</kbd> transform
        </span>
      )}
    </div>
  )
}

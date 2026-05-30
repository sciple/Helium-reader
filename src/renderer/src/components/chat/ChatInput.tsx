import { useRef, useEffect, KeyboardEvent } from 'react'
import { useEditorStore } from '../../store/editorStore'

interface Props {
  onSend: (text: string, contextText: string) => void
  onAbort: () => void
  isStreaming: boolean
}

export default function ChatInput({ onSend, onAbort, isStreaming }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const selectedText = useEditorStore((s) => s.selectedText)
  const selectionSize = useEditorStore((s) => s.selectionSize)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  })

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape' && isStreaming) {
      onAbort()
    }
  }

  function submit() {
    const el = textareaRef.current
    if (!el) return
    const text = el.value.trim()
    if (!text || isStreaming) return
    onSend(text, selectedText)
    el.value = ''
    el.style.height = 'auto'
  }

  return (
    <div className="chat-input">
      {selectionSize > 0 && (
        <div className="chat-input__context-badge">
          Using {selectionSize} chars from selection as context
        </div>
      )}
      <div className="chat-input__row">
        <textarea
          ref={textareaRef}
          className="chat-input__textarea"
          placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
          rows={4}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button className="chat-input__btn chat-input__btn--abort" onClick={onAbort}>
            ■
          </button>
        ) : (
          <button className="chat-input__btn" onClick={submit}>
            ↑
          </button>
        )}
      </div>
    </div>
  )
}

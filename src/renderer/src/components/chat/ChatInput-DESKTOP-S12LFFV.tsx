import { useRef, useEffect, KeyboardEvent } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useChatStore } from '../../store/chatStore'

interface Props {
  onSend: (text: string, contextText: string) => void
  onAbort: () => void
  isStreaming: boolean
}

export default function ChatInput({ onSend, onAbort, isStreaming }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const selectedText = useEditorStore((s) => s.selectedText)
  const selectionSize = useEditorStore((s) => s.selectionSize)
  const includeDocument = useChatStore((s) => s.includeDocument)
  const docContent = useEditorStore((s) => s.content)
  const docPath = useEditorStore((s) => s.currentFilePath)
  const docName = docPath?.split('/').pop() ?? 'document'
  const docWords = docContent.trim() === '' ? 0 : docContent.trim().split(/\s+/).length

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  })

  // Focus this textarea when the chat panel opens via keyboard
  useEffect(() => {
    const handler = () => textareaRef.current?.focus()
    window.addEventListener('focus-chat-input', handler)
    return () => window.removeEventListener('focus-chat-input', handler)
  }, [])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape') {
      if (isStreaming) {
        onAbort()
      } else {
        window.dispatchEvent(new CustomEvent('focus-editor'))
      }
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
      {includeDocument && docContent && (
        <div className="chat-input__context-badge chat-input__context-badge--doc">
          {docName} · {docWords.toLocaleString()} words as context
        </div>
      )}
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

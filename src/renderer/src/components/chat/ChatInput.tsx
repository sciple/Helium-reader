import { useRef, useEffect, KeyboardEvent } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useChatStore } from '../../store/chatStore'
import { useFileSystemStore } from '../../store/fileSystemStore'

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
  const pinnedByRoot = useChatStore((s) => s.pinnedByRoot)
  const togglePin = useChatStore((s) => s.togglePin)
  const docContent = useEditorStore((s) => s.content)
  const docPath = useEditorStore((s) => s.currentFilePath)
  const docName = docPath?.split('/').pop() ?? 'document'
  const docWords = docContent.trim() === '' ? 0 : docContent.trim().split(/\s+/).length
  const rootPath = useFileSystemStore((s) => s.rootPath)
  const pinnedPaths = rootPath ? (pinnedByRoot[rootPath] ?? []) : []

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
      {pinnedPaths.map((p) => (
        <div key={p} className="chat-input__context-badge chat-input__context-badge--pin">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
          </svg>
          <span>{p.split('/').pop()}</span>
          <button
            className="chat-input__badge-remove"
            title="Unpin"
            onClick={() => rootPath && togglePin(rootPath, p)}
          >✕</button>
        </div>
      ))}
      {includeDocument && docContent && (
        <div className="chat-input__context-badge chat-input__context-badge--doc">
          📄 {docName} · {docWords.toLocaleString()} words as context
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

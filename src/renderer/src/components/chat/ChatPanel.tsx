import './ChatPanel.css'
import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../store/chatStore'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

export default function ChatPanel() {
  const { messages, isStreaming, lmStudioUrl, model, systemPrompt, contextWindow, contextUsed, sendMessage, abort, clearHistory, removeMessage, setUrl, setModel, setSystemPrompt, setContextWindow } =
    useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [urlDraft, setUrlDraft] = useState(lmStudioUrl)
  const [modelDraft, setModelDraft] = useState(model)
  const [systemPromptDraft, setSystemPromptDraft] = useState(systemPrompt)
  const [contextWindowDraft, setContextWindowDraft] = useState(contextWindow != null ? String(contextWindow) : '')

  // Auto-scroll to bottom on new tokens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (settingsOpen) {
      setUrlDraft(lmStudioUrl)
      setModelDraft(model)
      setSystemPromptDraft(systemPrompt)
      setContextWindowDraft(contextWindow != null ? String(contextWindow) : '')
    }
  }, [settingsOpen, lmStudioUrl, model, systemPrompt, contextWindow])

  function applySettings() {
    setUrl(urlDraft)
    setModel(modelDraft)
    setSystemPrompt(systemPromptDraft)
    const parsed = parseInt(contextWindowDraft, 10)
    setContextWindow(Number.isFinite(parsed) && parsed > 0 ? parsed : null)
    setSettingsOpen(false)
  }

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <span className="chat-panel__title">Chat</span>
        <div className="chat-panel__header-actions">
          <button
            className={`chat-panel__icon-btn${settingsOpen ? ' chat-panel__icon-btn--active' : ''}`}
            onClick={() => setSettingsOpen((v) => !v)}
            title="Settings"
          >
            ⚙
          </button>
          <button
            className="chat-panel__icon-btn"
            onClick={clearHistory}
            title="Clear history"
          >
            ✕
          </button>
        </div>
      </div>

      {settingsOpen && (
        <div className="chat-panel__settings">
          <label className="chat-panel__settings-label">LM Studio URL</label>
          <input
            className="chat-panel__settings-input"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="http://localhost:1234"
          />
          <label className="chat-panel__settings-label">Model (leave blank for default)</label>
          <input
            className="chat-panel__settings-input"
            value={modelDraft}
            onChange={(e) => setModelDraft(e.target.value)}
            placeholder="e.g. lmstudio-community/Meta-Llama-3-8B"
          />
          <label className="chat-panel__settings-label">System prompt</label>
          <textarea
            className="chat-panel__settings-input chat-panel__settings-textarea"
            value={systemPromptDraft}
            onChange={(e) => setSystemPromptDraft(e.target.value)}
            placeholder="e.g. You are a helpful assistant specialized in neuroscience."
            rows={4}
          />
          <label className="chat-panel__settings-label">Context window (tokens)</label>
          <input
            className="chat-panel__settings-input"
            value={contextWindowDraft}
            onChange={(e) => setContextWindowDraft(e.target.value)}
            placeholder="e.g. 32768"
            inputMode="numeric"
          />
          <button className="chat-panel__settings-apply" onClick={applySettings}>
            Apply
          </button>
        </div>
      )}

      <div className="chat-panel__messages">
        {messages.length === 0 && (
          <div className="chat-panel__empty">
            No messages yet. Select text in the editor to use it as context.
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
            onRemove={removeMessage}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {contextUsed > 0 && (
        <div className="chat-panel__ctx-bar">
          {contextWindow != null && (
            <div className="chat-panel__ctx-track">
              <div
                className="chat-panel__ctx-fill"
                style={{ width: `${Math.min(100, (contextUsed / contextWindow) * 100)}%` }}
              />
            </div>
          )}
          <span className="chat-panel__ctx-label">
            {contextWindow != null
              ? `${contextUsed.toLocaleString()} / ${contextWindow.toLocaleString()} tokens`
              : `${contextUsed.toLocaleString()} tokens`}
          </span>
        </div>
      )}
      <ChatInput onSend={sendMessage} onAbort={abort} isStreaming={isStreaming} />
    </div>
  )
}

import { create } from 'zustand'
import { useEditorStore } from './editorStore'
import { useFileSystemStore } from './fileSystemStore'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatState {
  messages: ChatMessage[]
  isStreaming: boolean
  lmStudioUrl: string
  model: string
  systemPrompt: string
  contextWindow: number | null
  contextUsed: number
  _cleanup: (() => void) | null
  sendMessage: (userText: string, contextText: string) => Promise<void>
  abort: () => void
  clearHistory: () => void
  setUrl: (url: string) => void
  setModel: (model: string) => void
  setSystemPrompt: (prompt: string) => void
  setContextWindow: (value: number | null) => void
  removeMessage: (id: string) => void
  includeDocument: boolean
  toggleIncludeDocument: () => void
  pinnedByRoot: Record<string, string[]>
  togglePin: (rootPath: string, filePath: string) => void
  clearPins: (rootPath: string) => void
}

function parsePinnedByRoot(raw: string | null): Record<string, string[]> {
  if (!raw) return {}
  try { return JSON.parse(raw) as Record<string, string[]> } catch { return {} }
}

function parseContextWindow(raw: string | null): number | null {
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  lmStudioUrl: localStorage.getItem('lmStudioUrl') ?? 'http://localhost:1234',
  model: localStorage.getItem('lmStudioModel') ?? '',
  systemPrompt: localStorage.getItem('lmStudioSystemPrompt') ?? '',
  contextWindow: parseContextWindow(localStorage.getItem('lmStudioContextWindow')),
  contextUsed: 0,
  _cleanup: null,
  includeDocument: false,
  pinnedByRoot: parsePinnedByRoot(localStorage.getItem('chatPinnedByRoot')),

  sendMessage: async (userText, contextText) => {
    if (get().isStreaming) return
    get()._cleanup?.()

    const userContent = contextText
      ? `> ${contextText.split('\n').join('\n> ')}\n\n${userText}`
      : userText

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent
    }
    const assistantId = crypto.randomUUID()
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: ''
    }

    // Capture state before adding new messages to build the API payload
    const { lmStudioUrl, model, systemPrompt, messages: history, includeDocument, pinnedByRoot } = get()
    const { content: docContent, currentFilePath } = useEditorStore.getState()
    const fileName = currentFilePath?.split('/').pop() ?? 'document'

    set((s) => ({
      messages: [...s.messages, userMessage, assistantMessage],
      isStreaming: true
    }))

    const rootPath = useFileSystemStore.getState().rootPath
    const pins = rootPath ? (pinnedByRoot[rootPath] ?? []) : []
    const toSend = pins.filter((p) => !(includeDocument && p === currentFilePath))
    const pinnedDocs = (await Promise.all(
      toSend.map(async (p) => {
        try {
          const r = await window.api.readFile(p)
          return { name: p.split('/').pop() ?? p, content: r.content }
        } catch { return null }
      })
    )).filter((d): d is { name: string; content: string } => d != null)

    const apiMessages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      ...(includeDocument && docContent
        ? [{ role: 'system' as const, content: `Document context — ${fileName}:\n\n${docContent}` }]
        : []),
      ...pinnedDocs.map((d) => ({ role: 'system' as const, content: `Document context — ${d.name}:\n\n${d.content}` })),
      ...[...history, userMessage].map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }))
    ]

    await new Promise<void>((resolve) => {
      const offChunk = window.api.chat.onChunk((delta) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + delta } : m
          )
        }))
      })

      const offUsage = window.api.chat.onUsage(({ promptTokens, completionTokens }) => {
        set({ contextUsed: promptTokens + completionTokens })
      })

      const cleanup = () => {
        offChunk()
        offUsage()
        offDone()
        offError()
        set({ isStreaming: false, _cleanup: null })
        resolve()
      }

      set({ _cleanup: cleanup })

      const offDone = window.api.chat.onDone(cleanup)

      const offError = window.api.chat.onError((message) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantId ? { ...m, content: `⚠ ${message}` } : m
          )
        }))
        cleanup()
      })

      window.api.chat.send({ url: lmStudioUrl, model, messages: apiMessages })
    })
  },

  abort: () => { get()._cleanup?.(); window.api.chat.abort() },

  clearHistory: () => set({ messages: [], contextUsed: 0 }),

  setUrl: (url) => {
    localStorage.setItem('lmStudioUrl', url)
    set({ lmStudioUrl: url })
  },

  setModel: (model) => {
    localStorage.setItem('lmStudioModel', model)
    set({ model })
  },

  setSystemPrompt: (prompt) => {
    localStorage.setItem('lmStudioSystemPrompt', prompt)
    set({ systemPrompt: prompt })
  },

  removeMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id), contextUsed: 0 })),
  toggleIncludeDocument: () => set((s) => ({ includeDocument: !s.includeDocument })),

  togglePin: (rootPath, filePath) => set((s) => {
    const current = s.pinnedByRoot[rootPath] ?? []
    const next = current.includes(filePath)
      ? current.filter((p) => p !== filePath)
      : [...current, filePath]
    const updated = { ...s.pinnedByRoot, [rootPath]: next }
    localStorage.setItem('chatPinnedByRoot', JSON.stringify(updated))
    return { pinnedByRoot: updated }
  }),

  clearPins: (rootPath) => set((s) => {
    const updated = { ...s.pinnedByRoot, [rootPath]: [] }
    localStorage.setItem('chatPinnedByRoot', JSON.stringify(updated))
    return { pinnedByRoot: updated }
  }),

  setContextWindow: (value) => {
    if (value != null) localStorage.setItem('lmStudioContextWindow', String(value))
    else localStorage.removeItem('lmStudioContextWindow')
    set({ contextWindow: value })
  }
}))

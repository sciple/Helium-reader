import { create } from 'zustand'
import { transformApi } from '../lib/tauri-api'
import { useEditorStore } from './editorStore'
import { useChatStore } from './chatStore'

interface TransformState {
  isOpen: boolean
  isStreaming: boolean
  instruction: string
  originalText: string
  result: string
  _cleanup: (() => void) | null

  open: () => void
  close: () => void
  setInstruction: (s: string) => void
  run: () => void
  accept: () => void
  discard: () => void
  abort: () => void
}

export const useTransformStore = create<TransformState>((set, get) => ({
  isOpen: false,
  isStreaming: false,
  instruction: '',
  originalText: '',
  result: '',
  _cleanup: null,

  open: () => {
    const text = useEditorStore.getState().selectedText
    set({ isOpen: true, originalText: text, result: '', instruction: '' })
  },

  close: () => {
    get()._cleanup?.()
    set({ isOpen: false, isStreaming: false, result: '', instruction: '', _cleanup: null })
  },

  setInstruction: (s) => set({ instruction: s }),

  run: () => {
    const { instruction, originalText, _cleanup } = get()
    if (!instruction.trim() || !originalText.trim()) return
    if (get().isStreaming) return

    // Clean up any previous stream
    _cleanup?.()

    const { lmStudioUrl: url, model } = useChatStore.getState()

    const messages = [
      {
        role: 'system',
        content:
          'You are a precise writing assistant. ' +
          'Return ONLY the rewritten text — no preamble, no explanation, no commentary, no closing remarks. ' +
          'Do not begin with phrases like "Here is", "Certainly", "Sure", or "I hope". ' +
          'Output the transformed text and nothing else.',
      },
      { role: 'user', content: `${instruction.trim()}:\n\n${originalText}` },
    ]

    set({ isStreaming: true, result: '' })

    const offChunk = transformApi.onChunk((delta) =>
      set((s) => ({ result: s.result + delta }))
    )

    const cleanup = () => {
      offChunk()
      offDone()
      offError()
      set({ isStreaming: false, _cleanup: null })
    }

    set({ _cleanup: cleanup })

    const offDone  = transformApi.onDone(cleanup)
    const offError = transformApi.onError((msg) => {
      set((s) => ({ result: s.result + `\n\n⚠ ${msg}` }))
      cleanup()
    })

    transformApi.send({ url, model, messages })
  },

  accept: () => {
    const { result } = get()
    if (!result.trim()) return
    window.dispatchEvent(new CustomEvent('editor:replace-selection', { detail: result }))
    set({ result: '' })
  },

  discard: () => {
    get()._cleanup?.()
    set({ result: '', isStreaming: false, _cleanup: null })
  },

  abort: () => {
    transformApi.abort()
    get()._cleanup?.()
    set({ isStreaming: false, _cleanup: null })
  },
}))

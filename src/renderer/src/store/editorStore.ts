import { create } from 'zustand'

interface EditorState {
  currentFilePath: string | null
  content: string
  savedContent: string
  isDirty: boolean
  selectionSize: number
  selectedText: string
  openFile: (path: string, content: string) => void
  updateContent: (content: string) => void
  updateSelection: (size: number, text: string) => void
  markSaved: (path?: string) => void
  setPath: (path: string) => void
  newFile: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentFilePath: null,
  content: '',
  savedContent: '',
  isDirty: false,
  selectionSize: 0,
  selectedText: '',

  openFile: (path, content) =>
    set({ currentFilePath: path, content, savedContent: content, isDirty: false }),

  updateContent: (content) =>
    set({ content, isDirty: content !== get().savedContent }),

  updateSelection: (size, text) => set({ selectionSize: size, selectedText: text }),

  markSaved: (path) =>
    set((s) => ({
      savedContent: s.content,
      isDirty: false,
      currentFilePath: path ?? s.currentFilePath
    })),

  // The open file moved on disk (rename). Content and the unsaved flag are kept.
  setPath: (path) => set({ currentFilePath: path }),

  newFile: () =>
    set({ currentFilePath: null, content: '', savedContent: '', isDirty: false })
}))

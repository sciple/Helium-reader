import { create } from 'zustand'

export type PreviewFont = 'serif' | 'sans' | 'mono'
export type ColorTheme = 'dark' | 'light'
export type ProseWidth = 'narrow' | 'default' | 'wide' | 'full'

const FONT_SIZE_MIN = 10
const FONT_SIZE_MAX = 26
const FONT_SIZE_STEP = 1

interface UiState {
  sidebarVisible: boolean
  focusMode: boolean
  previewVisible: boolean
  previewFont: PreviewFont
  colorTheme: ColorTheme
  editorFontSize: number
  proseWidth: ProseWidth
  splitRatio: number
  newFileRequested: boolean
  chatPanelVisible: boolean
  chatPanelWidth: number
  shortcutsVisible: boolean
  toggleSidebar: () => void
  setSidebarVisible: (v: boolean) => void
  toggleFocusMode: () => void
  setFocusMode: (v: boolean) => void
  togglePreview: () => void
  setPreviewFont: (font: PreviewFont) => void
  setProseWidth: (w: ProseWidth) => void
  toggleColorTheme: () => void
  increaseEditorFontSize: () => void
  decreaseEditorFontSize: () => void
  setSplitRatio: (ratio: number) => void
  requestNewFile: () => void
  clearNewFileRequest: () => void
  toggleChatPanel: () => void
  setChatPanelWidth: (w: number) => void
  toggleShortcuts: () => void
  setShortcutsVisible: (v: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarVisible: true,
  focusMode: false,
  previewVisible: false,
  previewFont: 'mono',
  colorTheme: 'light',
  editorFontSize: 15,
  proseWidth: 'default',
  splitRatio: 0.5,
  newFileRequested: false,
  chatPanelVisible: false,
  chatPanelWidth: 340,
  shortcutsVisible: false,

  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  setSidebarVisible: (v) => set({ sidebarVisible: v }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setFocusMode: (v) => set({ focusMode: v }),
  togglePreview: () => set((s) => ({ previewVisible: !s.previewVisible })),
  setPreviewFont: (font) => set({ previewFont: font }),
  setProseWidth: (w) => set({ proseWidth: w }),
  toggleColorTheme: () => set((s) => ({ colorTheme: s.colorTheme === 'dark' ? 'light' : 'dark' })),
  increaseEditorFontSize: () =>
    set((s) => ({ editorFontSize: Math.min(FONT_SIZE_MAX, s.editorFontSize + FONT_SIZE_STEP) })),
  decreaseEditorFontSize: () =>
    set((s) => ({ editorFontSize: Math.max(FONT_SIZE_MIN, s.editorFontSize - FONT_SIZE_STEP) })),
  setSplitRatio: (ratio) => set({ splitRatio: Math.max(0.2, Math.min(0.8, ratio)) }),
  requestNewFile: () => set({ newFileRequested: true }),
  clearNewFileRequest: () => set({ newFileRequested: false }),
  toggleChatPanel: () => set((s) => ({ chatPanelVisible: !s.chatPanelVisible })),
  setChatPanelWidth: (w) => set({ chatPanelWidth: Math.max(240, Math.min(600, w)) }),
  toggleShortcuts: () => set((s) => ({ shortcutsVisible: !s.shortcutsVisible })),
  setShortcutsVisible: (v) => set({ shortcutsVisible: v }),
}))

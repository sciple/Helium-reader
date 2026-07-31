import { create } from 'zustand'

export type BodyFont = 'georgia' | 'cambria' | 'palatino' | 'segoe' | 'verdana' | 'consolas'
export type HeadingFont = BodyFont | 'match'
export type CodeTheme = 'github-light' | 'github-dark'

export const FONT_SIZE_PT_MIN = 8
export const FONT_SIZE_PT_MAX = 16
export const LINE_HEIGHT_MIN = 1.2
export const LINE_HEIGHT_MAX = 2

export interface ExportSettings {
  bodyFont: BodyFont
  headingFont: HeadingFont
  fontSizePt: number
  lineHeight: number
  pageBg: string
  textColor: string
  linkColor: string
  headingColor: string
  codeTheme: CodeTheme
}

/** Faces that ship with Windows 11 — no Office-only or downloadable fonts. */
export const FONT_STACKS: Record<BodyFont, { label: string; stack: string }> = {
  georgia:  { label: 'Georgia',  stack: "Georgia, 'Times New Roman', serif" },
  cambria:  { label: 'Cambria',  stack: 'Cambria, Georgia, serif' },
  palatino: { label: 'Palatino', stack: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  segoe:    { label: 'Segoe UI', stack: "'Segoe UI', 'Segoe UI Variable Text', system-ui, sans-serif" },
  verdana:  { label: 'Verdana',  stack: 'Verdana, Geneva, Tahoma, sans-serif' },
  consolas: { label: 'Consolas', stack: "Consolas, 'Cascadia Mono', 'Courier New', monospace" }
}

/**
 * A white page with near-black ink — deliberately independent of the app's colour
 * theme, since a dark-mode editor should still export something printable.
 */
export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  bodyFont: 'georgia',
  headingFont: 'segoe',
  fontSizePt: 11,
  lineHeight: 1.5,
  pageBg: '#ffffff',
  textColor: '#1a1a1a',
  // Dark enough to stay legible when the PDF is printed in greyscale.
  linkColor: '#0b5cad',
  headingColor: '#111111',
  codeTheme: 'github-light'
}

const STORAGE_KEY = 'exportSettings'

function parseSettings(raw: string | null): ExportSettings {
  if (!raw) return DEFAULT_EXPORT_SETTINGS
  try {
    // Spread over the defaults so a key added in a later version is never
    // undefined for a user with an older blob in localStorage.
    return { ...DEFAULT_EXPORT_SETTINGS, ...(JSON.parse(raw) as Partial<ExportSettings>) }
  } catch {
    return DEFAULT_EXPORT_SETTINGS
  }
}

interface ExportState {
  settings: ExportSettings
  setSetting: <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => void
  resetSettings: () => void
}

export const useExportStore = create<ExportState>((set) => ({
  settings: parseSettings(localStorage.getItem(STORAGE_KEY)),

  setSetting: (key, value) =>
    set((s) => {
      const next = { ...s.settings, [key]: value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return { settings: next }
    }),

  resetSettings: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXPORT_SETTINGS))
    set({ settings: DEFAULT_EXPORT_SETTINGS })
  }
}))

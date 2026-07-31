import './ExportDialog.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import {
  useExportStore,
  FONT_STACKS,
  FONT_SIZE_PT_MIN,
  FONT_SIZE_PT_MAX,
  LINE_HEIGHT_MIN,
  LINE_HEIGHT_MAX,
  type BodyFont,
  type CodeTheme,
  type ExportSettings
} from '../../store/exportStore'
import { currentBaseDir } from '../../lib/mediaImages'
import { markdownToHtmlFragment } from '../../lib/export/exportPipeline'
import { buildExportDocument } from '../../lib/export/exportDocument'
import { buildExportStylesheet, STYLE_ELEMENT_ID } from '../../lib/export/exportStylesheet'
import { writeDocument, printHtml } from '../../lib/export/printToPdf'
import { notify } from '../../lib/notice'

interface Props {
  onClose: () => void
}

/** Slightly longer than the preview pane's 150 ms — Shiki tokenising is in this path. */
const FRAGMENT_DEBOUNCE_MS = 200

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

/** The settings whose values are #rrggbb strings. */
type ColorKey = 'pageBg' | 'textColor' | 'linkColor' | 'headingColor'

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: 'pageBg', label: 'Page background' },
  { key: 'textColor', label: 'Body text' },
  { key: 'linkColor', label: 'Links' },
  { key: 'headingColor', label: 'Headings' }
]

const CODE_THEMES: { key: CodeTheme; label: string }[] = [
  { key: 'github-light', label: 'Light' },
  { key: 'github-dark', label: 'Dark' }
]

/**
 * A colour picker paired with a hex field. The text input keeps its own draft so
 * half-typed values like "#1a2" stay on screen; only a complete hex commits to the
 * store, and the draft resyncs whenever the committed value changes elsewhere
 * (the picker, or Reset to defaults).
 */
function ColorField({
  label,
  value,
  onCommit
}: {
  label: string
  value: string
  onCommit: (hex: string) => void
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => setDraft(value), [value])

  return (
    <div className="export-dialog__field">
      <span className="export-dialog__label">{label}</span>
      <div className="export-dialog__color-row">
        <input
          className="export-dialog__color"
          type="color"
          value={value}
          onChange={(e) => onCommit(e.target.value)}
          aria-label={label}
        />
        <input
          className="export-dialog__hex"
          type="text"
          maxLength={7}
          spellCheck={false}
          value={draft}
          onChange={(e) => {
            const next = e.target.value
            setDraft(next)
            if (HEX_PATTERN.test(next)) onCommit(next.toLowerCase())
          }}
          onBlur={() => setDraft(value)}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  )
}

export default function ExportDialog({ onClose }: Props) {
  const content = useEditorStore((s) => s.content)
  const currentFilePath = useEditorStore((s) => s.currentFilePath)
  const settings = useExportStore((s) => s.settings)
  const setSetting = useExportStore((s) => s.setSetting)
  const resetSettings = useExportStore((s) => s.resetSettings)

  const [fragment, setFragment] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const frameRef = useRef<HTMLIFrameElement>(null)

  const isEmpty = content.trim().length === 0
  const docTitle = (currentFilePath?.split('/').pop() ?? 'Untitled').replace(/\.md$/i, '')

  // Esc only — unlike ShortcutsOverlay, '?' must not close this, since the user
  // may well be typing it into a hex field.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // ── Tier 1: markdown → HTML. Expensive, so debounced. Only content and the code
  // theme can invalidate it; everything else is styling. ─────────────────────────
  useEffect(() => {
    if (isEmpty) {
      setFragment('')
      return
    }
    const baseDir = currentBaseDir()
    const timer = setTimeout(() => {
      markdownToHtmlFragment(content, { codeTheme: settings.codeTheme, baseDir })
        .then(setFragment)
        .catch(() => {
          // Keep the last good render on screen rather than blanking the preview.
        })
    }, FRAGMENT_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [content, settings.codeTheme, isEmpty])

  // ── Tier 2: rewrite the preview document whenever the fragment changes. ───────
  useEffect(() => {
    const frame = frameRef.current
    if (!frame || fragment == null) return
    // `settings` is read but not depended on: tier 3 keeps the styles in sync
    // without paying for a full document rewrite.
    const current = useExportStore.getState().settings
    void writeDocument(frame, buildExportDocument(fragment, current, docTitle)).then(() => {
      // Settings may have changed during the write (it awaits fonts and images),
      // in which case tier 3 patched a document that no longer exists. Re-apply.
      const styleEl = frame.contentDocument?.getElementById(STYLE_ELEMENT_ID)
      if (styleEl) {
        styleEl.textContent = buildExportStylesheet(useExportStore.getState().settings)
      }
    })
  }, [fragment, docTitle])

  // ── Tier 3: style-only changes patch the live document in place. One assignment,
  // no reparse, no font reload, no flash — so dragging a colour picker is free. ──
  useEffect(() => {
    const styleEl = frameRef.current?.contentDocument?.getElementById(STYLE_ELEMENT_ID)
    if (styleEl) styleEl.textContent = buildExportStylesheet(settings)
  }, [settings])

  const handleExport = useCallback(async () => {
    if (isEmpty || busy) return
    setBusy(true)
    try {
      const baseDir = currentBaseDir()
      // Rebuilt from scratch rather than reusing the debounced preview fragment, so
      // an export fired mid-keystroke still reflects the current buffer.
      const html = buildExportDocument(
        await markdownToHtmlFragment(content, { codeTheme: settings.codeTheme, baseDir }),
        settings,
        docTitle
      )
      await printHtml(html)
      onClose()
    } catch {
      notify('Could not open the print dialog.')
    } finally {
      setBusy(false)
    }
  }, [content, settings, docTitle, isEmpty, busy, onClose])

  return (
    <div className="export-backdrop" onMouseDown={onClose}>
      <div className="export-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <div className="export-dialog__header">
          <span className="export-dialog__title">Export to PDF</span>
          <button className="export-dialog__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="export-dialog__body">
          <div className="export-dialog__controls">
            <div className="export-dialog__group-title">Typography</div>

            <label className="export-dialog__field">
              <span className="export-dialog__label">Body font</span>
              <select
                className="export-dialog__select"
                value={settings.bodyFont}
                onChange={(e) => setSetting('bodyFont', e.target.value as BodyFont)}
              >
                {Object.entries(FONT_STACKS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>

            <label className="export-dialog__field">
              <span className="export-dialog__label">Heading font</span>
              <select
                className="export-dialog__select"
                value={settings.headingFont}
                onChange={(e) =>
                  setSetting('headingFont', e.target.value as ExportSettings['headingFont'])
                }
              >
                <option value="match">Match body</option>
                {Object.entries(FONT_STACKS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>

            <label className="export-dialog__field">
              <span className="export-dialog__label">
                Base size <span className="export-dialog__readout">{settings.fontSizePt} pt</span>
              </span>
              <input
                className="export-dialog__range"
                type="range"
                min={FONT_SIZE_PT_MIN}
                max={FONT_SIZE_PT_MAX}
                step={0.5}
                value={settings.fontSizePt}
                onChange={(e) => setSetting('fontSizePt', Number(e.target.value))}
              />
            </label>

            <label className="export-dialog__field">
              <span className="export-dialog__label">
                Line height{' '}
                <span className="export-dialog__readout">{settings.lineHeight.toFixed(2)}</span>
              </span>
              <input
                className="export-dialog__range"
                type="range"
                min={LINE_HEIGHT_MIN}
                max={LINE_HEIGHT_MAX}
                step={0.05}
                value={settings.lineHeight}
                onChange={(e) => setSetting('lineHeight', Number(e.target.value))}
              />
            </label>

            <div className="export-dialog__group-title">Colors</div>

            {COLOR_FIELDS.map(({ key, label }) => (
              <ColorField
                key={key}
                label={label}
                value={settings[key]}
                onCommit={(hex) => setSetting(key, hex)}
              />
            ))}

            <div className="export-dialog__field">
              <span className="export-dialog__label">Code blocks</span>
              <div className="export-dialog__segmented">
                {CODE_THEMES.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`export-dialog__segment ${
                      settings.codeTheme === key ? 'export-dialog__segment--active' : ''
                    }`}
                    onClick={() => setSetting('codeTheme', key)}
                    aria-pressed={settings.codeTheme === key}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="export-dialog__preview">
            <div className="export-dialog__page">
              {isEmpty ? (
                <div className="export-dialog__empty">
                  Nothing to export — this document is empty.
                </div>
              ) : (
                <iframe
                  ref={frameRef}
                  className="export-dialog__frame"
                  title="PDF preview"
                  tabIndex={-1}
                />
              )}
            </div>
            <p className="export-dialog__hint">
              Scroll inside the page to preview later pages. Paper size and margins are
              chosen in the print dialog.
            </p>
          </div>
        </div>

        <div className="export-dialog__footer">
          <button className="export-dialog__reset" onClick={resetSettings}>
            Reset to defaults
          </button>
          <div className="export-dialog__actions">
            <button className="export-dialog__btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="export-dialog__btn export-dialog__btn--primary"
              onClick={handleExport}
              disabled={isEmpty || busy}
            >
              {busy ? 'Preparing…' : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

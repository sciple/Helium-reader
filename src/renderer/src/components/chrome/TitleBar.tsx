import './TitleBar.css'
import { useEditorStore } from '../../store/editorStore'
import { useUiStore, type PreviewFont, type ProseWidth } from '../../store/uiStore'

const FONTS: { key: PreviewFont; label: string; title: string }[] = [
  { key: 'serif', label: 'Serif', title: 'Serif font (Georgia)' },
  { key: 'sans',  label: 'Sans',  title: 'Sans-serif font (system UI)' },
  { key: 'mono',  label: 'Mono',  title: 'Monospace font' }
]

const WIDTHS: { key: ProseWidth; label: string; title: string }[] = [
  { key: 'narrow',  label: 'S', title: 'Narrow line width (520 px)' },
  { key: 'default', label: 'M', title: 'Default line width (720 px)' },
  { key: 'wide',    label: 'L', title: 'Wide line width (960 px)' },
  { key: 'full',    label: '∞', title: 'Full pane width' }
]

export default function TitleBar() {
  const currentFilePath = useEditorStore((s) => s.currentFilePath)
  const isDirty = useEditorStore((s) => s.isDirty)
  const previewFont = useUiStore((s) => s.previewFont)
  const setPreviewFont = useUiStore((s) => s.setPreviewFont)
  const previewVisible = useUiStore((s) => s.previewVisible)
  const togglePreview = useUiStore((s) => s.togglePreview)
  const chatPanelVisible = useUiStore((s) => s.chatPanelVisible)
  const toggleChatPanel = useUiStore((s) => s.toggleChatPanel)
  const colorTheme = useUiStore((s) => s.colorTheme)
  const toggleColorTheme = useUiStore((s) => s.toggleColorTheme)
  const editorFontSize = useUiStore((s) => s.editorFontSize)
  const increaseEditorFontSize = useUiStore((s) => s.increaseEditorFontSize)
  const decreaseEditorFontSize = useUiStore((s) => s.decreaseEditorFontSize)
  const proseWidth = useUiStore((s) => s.proseWidth)
  const setProseWidth = useUiStore((s) => s.setProseWidth)
  const toggleShortcuts = useUiStore((s) => s.toggleShortcuts)

  const fileName = currentFilePath
    ? currentFilePath.split('/').pop()
    : 'Helium Reader'

  const title = isDirty ? `● ${fileName}` : (fileName ?? 'Helium Reader')

  return (
    <div className="titlebar">
      <div className="titlebar__toolbar">
        <button
          className="titlebar__tool"
          onClick={toggleColorTheme}
          title={colorTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle color theme"
        >
          {colorTheme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="3" fill="currentColor"/>
              <line x1="7" y1="1" x2="7" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="7" y1="11.5" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="1" y1="7" x2="2.5" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="11.5" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2.93" y1="2.93" x2="4" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="10" y1="10" x2="11.07" y2="11.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="11.07" y1="2.93" x2="10" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="4" y1="10" x2="2.93" y2="11.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 2a5 5 0 1 0 5 5 5 5 0 0 0-4-4.9A3.5 3.5 0 0 1 7 2z" fill="currentColor"/>
            </svg>
          )}
        </button>
        <button
          className={`titlebar__tool ${!previewVisible ? 'titlebar__tool--active' : ''}`}
          onClick={togglePreview}
          title="Toggle preview (Ctrl+\)"
          aria-label="Toggle preview"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="5" height="12" rx="1" fill="currentColor" opacity="0.9"/>
            <rect x="8" y="1" width="5" height="12" rx="1" fill="currentColor" opacity={previewVisible ? '0.9' : '0.25'}/>
          </svg>
        </button>
        <button
          className={`titlebar__tool ${chatPanelVisible ? 'titlebar__tool--active' : ''}`}
          onClick={toggleChatPanel}
          title="Toggle chat (Ctrl+Shift+L)"
          aria-label="Toggle chat panel"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-3 3v-3H2a1 1 0 0 1-1-1V2z"
              fill="currentColor" opacity={chatPanelVisible ? '0.9' : '0.35'}/>
          </svg>
        </button>
        <div className="titlebar__font-size">
          <button
            className="titlebar__font-btn"
            onClick={decreaseEditorFontSize}
            title="Decrease editor font size"
            aria-label="Decrease editor font size"
            disabled={editorFontSize <= 10}
          >
            A−
          </button>
          <span className="titlebar__font-size-label">{editorFontSize}</span>
          <button
            className="titlebar__font-btn"
            onClick={increaseEditorFontSize}
            title="Increase editor font size"
            aria-label="Increase editor font size"
            disabled={editorFontSize >= 26}
          >
            A+
          </button>
        </div>
        <div className="titlebar__width-picker">
          {WIDTHS.map(({ key, label, title: t }) => (
            <button
              key={key}
              className={`titlebar__font-btn ${proseWidth === key ? 'titlebar__font-btn--active' : ''}`}
              onClick={() => setProseWidth(key)}
              title={t}
              aria-label={t}
              aria-pressed={proseWidth === key}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="titlebar__font-picker">
          {FONTS.map(({ key, label, title: t }) => (
            <button
              key={key}
              className={`titlebar__font-btn ${previewFont === key ? 'titlebar__font-btn--active' : ''}`}
              onClick={() => setPreviewFont(key)}
              title={previewVisible ? t : 'Open the preview pane to change its font'}
              aria-label={t}
              aria-pressed={previewFont === key}
              disabled={!previewVisible}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="titlebar__tool titlebar__tool--help"
          onClick={toggleShortcuts}
          title="Keyboard shortcuts (?)"
          aria-label="Show keyboard shortcuts"
        >
          ?
        </button>
      </div>
      <div className="titlebar__drag" />
      <span className="titlebar__title">{title}</span>
      <div className="titlebar__controls">
        <button
          className="titlebar__btn titlebar__btn--min"
          onClick={() => window.api.windowControl('minimize')}
          aria-label="Minimize"
        />
        <button
          className="titlebar__btn titlebar__btn--max"
          onClick={() => window.api.windowControl('maximize')}
          aria-label="Maximize"
        />
        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={() => window.api.windowControl('close')}
          aria-label="Close"
        />
      </div>
    </div>
  )
}

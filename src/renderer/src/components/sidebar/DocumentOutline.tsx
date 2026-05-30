import './DocumentOutline.css'
import { useState } from 'react'
import { useDocumentOutline } from '../../hooks/useDocumentOutline'

export default function DocumentOutline() {
  const headings = useDocumentOutline()
  const [expanded, setExpanded] = useState(true)

  function handleClick(id: string, text: string, level: number) {
    // Scroll preview pane
    const previewPane = document.querySelector<HTMLElement>('.preview-pane')
    const target = document.getElementById(id)
    if (previewPane && target) {
      const targetTop = target.getBoundingClientRect().top
      const paneTop = previewPane.getBoundingClientRect().top
      previewPane.scrollTop += targetTop - paneTop - 16
    }

    // Scroll CodeMirror editor
    window.dispatchEvent(
      new CustomEvent('editor:scroll-to-heading', { detail: { text, level } })
    )
  }

  return (
    <div className="doc-outline">
      <button
        className="doc-outline__header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="doc-outline__chevron">{expanded ? '▾' : '▸'}</span>
        <span className="doc-outline__title">Outline</span>
      </button>

      {expanded && (
        <div className="doc-outline__body">
          {headings.length === 0 ? (
            <span className="doc-outline__empty">No headings yet</span>
          ) : (
            <ul className="doc-outline__list">
              {headings.map((h, i) => (
                <li key={i} className="doc-outline__item">
                  <button
                    className="doc-outline__link"
                    style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                    onClick={() => handleClick(h.id, h.text, h.level)}
                    title={h.text}
                  >
                    <span className="doc-outline__marker">≡</span>
                    <span className="doc-outline__text">{h.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="doc-outline__divider" />
    </div>
  )
}

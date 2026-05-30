import './ShortcutsOverlay.css'
import { useEffect } from 'react'

interface Props {
  onClose: () => void
}

const SECTIONS = [
  {
    title: 'Navigation',
    rows: [
      ['Ctrl+B',         'Toggle sidebar'],
      ['Ctrl+\\',        'Toggle preview'],
      ['Ctrl+Shift+L',   'Open / close chat'],
      ['F11',            'Focus mode'],
      ['?',              'This overlay'],
    ],
  },
  {
    title: 'Editor',
    rows: [
      ['Ctrl+S',         'Save'],
      ['Ctrl+Shift+S',   'Save As'],
      ['Ctrl+Shift+O',   'Open folder'],
      ['Ctrl+N',         'New file'],
      ['Ctrl+Z',         'Undo'],
      ['Ctrl+Shift+Z',   'Redo'],
      ['Ctrl+Shift+T',   'Transform selection'],
    ],
  },
  {
    title: 'Chat',
    rows: [
      ['Ctrl+Shift+L',   'Open + focus input'],
      ['Enter',          'Send message'],
      ['Shift+Enter',    'New line'],
      ['Esc',            'Back to editor'],
      ['Esc (streaming)','Abort stream'],
    ],
  },
]

export default function ShortcutsOverlay({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="shortcuts-backdrop" onMouseDown={onClose}>
      <div className="shortcuts-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="shortcuts-modal__header">
          <span className="shortcuts-modal__title">Keyboard Shortcuts</span>
          <button className="shortcuts-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="shortcuts-modal__grid">
          {SECTIONS.map((section) => (
            <div key={section.title} className="shortcuts-section">
              <div className="shortcuts-section__title">{section.title}</div>
              <table className="shortcuts-table">
                <tbody>
                  {section.rows.map(([key, desc]) => (
                    <tr key={key + desc}>
                      <td className="shortcuts-table__key">
                        {key.split('+').map((part, i, arr) => (
                          <span key={i}>
                            <kbd>{part}</kbd>
                            {i < arr.length - 1 && <span className="shortcuts-table__plus">+</span>}
                          </span>
                        ))}
                      </td>
                      <td className="shortcuts-table__desc">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <div className="shortcuts-modal__footer">Press <kbd>?</kbd> or <kbd>Esc</kbd> to close</div>
      </div>
    </div>
  )
}

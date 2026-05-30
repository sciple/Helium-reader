import './TransformPanel.css'
import { useEffect, useRef } from 'react'
import { useTransformStore } from '../../store/transformStore'

const PRESETS = [
  'Improve style',
  'Make concise',
  'Expand',
  'Fix grammar',
  'Formal tone',
  'Casual tone',
]

export default function TransformPanel() {
  const {
    isStreaming, instruction, originalText, result,
    setInstruction, run, accept, discard, abort, close,
  } = useTransformStore()

  const customRef = useRef<HTMLInputElement>(null)

  // Esc closes the panel (unless streaming, where it aborts)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (isStreaming) abort()
        else { close(); window.dispatchEvent(new CustomEvent('focus-editor')) }
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [isStreaming, abort, close])

  function handlePreset(preset: string) {
    setInstruction(preset)
    // Run immediately on preset click
    useTransformStore.setState({ instruction: preset })
    useTransformStore.getState().run()
  }

  function handleCustomKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); run() }
  }

  const hasResult = result.trim().length > 0
  const canAccept = hasResult && !isStreaming

  return (
    <div className="transform-panel">
      <div className="transform-panel__toolbar">
        <span className="transform-panel__label">Transform</span>
        <div className="transform-panel__presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              className={`transform-panel__preset${instruction === p ? ' transform-panel__preset--active' : ''}`}
              onClick={() => handlePreset(p)}
              disabled={isStreaming}
            >
              {p}
            </button>
          ))}
          <input
            ref={customRef}
            className="transform-panel__custom"
            placeholder="Custom instruction…"
            value={PRESETS.includes(instruction) ? '' : instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onFocus={() => { if (PRESETS.includes(instruction)) setInstruction('') }}
            onKeyDown={handleCustomKey}
            disabled={isStreaming}
          />
          <button
            className="transform-panel__run"
            onClick={run}
            disabled={isStreaming || !instruction.trim() || !originalText.trim()}
            title="Run (Enter)"
          >
            {isStreaming ? '…' : '▶'}
          </button>
        </div>
        <button className="transform-panel__close" onClick={() => { close(); window.dispatchEvent(new CustomEvent('focus-editor')) }} title="Close (Esc)">✕</button>
      </div>

      <div className="transform-panel__result">
        {!result && !isStreaming && (
          <span className="transform-panel__placeholder">
            {originalText ? 'Choose an instruction above to transform the selected text.' : 'Select text in the editor first, then open this panel.'}
          </span>
        )}
        {result && <pre className="transform-panel__output">{result}</pre>}
      </div>

      <div className="transform-panel__actions">
        <button
          className="transform-panel__btn transform-panel__btn--discard"
          onClick={discard}
          disabled={!hasResult && !isStreaming}
        >
          {isStreaming ? 'Abort' : 'Discard'}
        </button>
        <button
          className="transform-panel__btn transform-panel__btn--accept"
          onClick={accept}
          disabled={!canAccept}
          title="Replace selected text in editor"
        >
          Accept ✓
        </button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import type { StreamPhaseName } from '../../store/chatStore'

interface Props {
  phase: StreamPhaseName | null
  startedAt: number
  tokens: number
  files?: number
  /** How to stop the request in this panel, e.g. "Esc to stop". */
  stopHint: string
}

function formatTokens(n: number): string {
  return n >= 1000 ? `~${Math.round(n / 1000)}k` : `~${n}`
}

/**
 * The line shown while a request has not produced any answer text yet: what the
 * model is doing and how long it has been at it. The counter ticks here rather
 * than in the store, so nothing else re-renders every second.
 */
export default function StreamPhase({ phase, startedAt, tokens, files = 0, stopHint }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!phase) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  if (!phase) return null

  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  const label =
    phase === 'reading-files'
      ? `Reading ${files} pinned file${files === 1 ? '' : 's'}…`
      : phase === 'thinking'
        ? 'Model is thinking'
        : `Model is reading the prompt (${formatTokens(tokens)} tokens)`

  return (
    <div className="stream-phase">
      {label} · {seconds} s · {stopHint}
    </div>
  )
}

import './Notice.css'
import { useEffect, useRef, useState } from 'react'
import { NOTICE_EVENT } from '../../lib/notice'

const DISMISS_MS = 4000

export default function Notice() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setMessage(null), DISMISS_MS)
    }
    window.addEventListener(NOTICE_EVENT, handler)
    return () => {
      window.removeEventListener(NOTICE_EVENT, handler)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  if (!message) return null

  return (
    <div className="notice" role="status" onClick={() => setMessage(null)}>
      {message}
    </div>
  )
}

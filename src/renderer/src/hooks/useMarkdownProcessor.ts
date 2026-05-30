import { useMemo, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createProcessor } from '../lib/remark-pipeline.tsx'

const processor = createProcessor()

export function useMarkdownProcessor(markdown: string): ReactNode {
  const [rendered, setRendered] = useState<ReactNode>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const file = await processor.process(markdown)
        setRendered(file.result as ReactNode)
      } catch {
        // ignore processing errors
      }
    }, 150)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [markdown])

  return rendered
}

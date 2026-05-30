import { useEffect, useState } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { useEditorStore } from '../store/editorStore'
import { slugify } from '../lib/slugify'

export interface HeadingEntry {
  level: number
  text: string
  id: string
}

function extractText(node: Record<string, unknown>): string {
  if (typeof node.value === 'string') return node.value
  if (Array.isArray(node.children)) {
    return (node.children as Record<string, unknown>[]).map(extractText).join('')
  }
  return ''
}

export function useDocumentOutline(): HeadingEntry[] {
  const content = useEditorStore((s) => s.content)
  const [headings, setHeadings] = useState<HeadingEntry[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!content.trim()) {
        setHeadings([])
        return
      }
      try {
        const processor = unified().use(remarkParse).use(remarkGfm)
        const tree = processor.parse(content) as { children: Record<string, unknown>[] }
        const result: HeadingEntry[] = []
        for (const node of tree.children) {
          if (node.type === 'heading') {
            const text = extractText(node)
            if (text) {
              result.push({ level: node.depth as number, text, id: slugify(text) })
            }
          }
        }
        setHeadings(result)
      } catch {
        setHeadings([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [content])

  return headings
}

import { useEffect, useState, type ComponentPropsWithoutRef } from 'react'
import { getHighlighter } from '../../lib/shiki-instance'

type Props = ComponentPropsWithoutRef<'pre'>

export default function CodeBlock({ children, ...rest }: Props) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    const codeEl = (children as React.ReactElement)?.props
    if (!codeEl) return

    const rawCode = typeof codeEl.children === 'string' ? codeEl.children : ''
    const className: string = codeEl.className ?? ''
    const lang = className.replace('language-', '') || 'text'

    getHighlighter().then((hl) => {
      try {
        const highlighted = hl.codeToHtml(rawCode.trimEnd(), {
          lang,
          theme: 'github-dark'
        })
        setHtml(highlighted)
      } catch {
        setHtml(`<pre><code>${rawCode}</code></pre>`)
      }
    })
  }, [children])

  if (html) {
    return <div className="code-block" dangerouslySetInnerHTML={{ __html: html }} />
  }

  return <pre {...rest}>{children}</pre>
}

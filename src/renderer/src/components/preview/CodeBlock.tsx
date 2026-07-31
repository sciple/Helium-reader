import {
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode
} from 'react'
import { getHighlighter } from '../../lib/shiki-instance'

type Props = ComponentPropsWithoutRef<'pre'>

/**
 * What rehype-react hands a <pre>: a single <code> child carrying the fence's
 * source text and its `language-*` class. React 19 types `ReactElement`'s props
 * as `unknown` by default, so the expected shape has to be stated explicitly.
 */
type CodeElementProps = { children?: ReactNode; className?: string }

export default function CodeBlock({ children, ...rest }: Props) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    const codeEl = (children as ReactElement<CodeElementProps> | undefined)?.props
    if (!codeEl) return

    const rawCode = typeof codeEl.children === 'string' ? codeEl.children : ''
    const className: string = codeEl.className ?? ''
    const lang = className.replace('language-', '') || 'text'

    getHighlighter()
      .then((hl) => {
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
      .catch((err) => {
        // The highlighter itself failed to start (it compiles a WebAssembly grammar
        // engine, which a strict CSP can block). Falling back to an unhighlighted
        // <pre> is fine, but doing it silently hid exactly that bug for a long time.
        console.warn('[preview] syntax highlighting unavailable:', err)
      })
  }, [children])

  if (html) {
    return <div className="code-block" dangerouslySetInnerHTML={{ __html: html }} />
  }

  return <pre {...rest}>{children}</pre>
}

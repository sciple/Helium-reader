import { unified, type Processor } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeKatex from 'rehype-katex'

export const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // `hast-util-sanitize` uses the *first* entry matching a property name, so the
    // math classes have to go in the same tuple as the default `language-*` rule —
    // a second `'className'` entry after it would never be reached.
    code: [['className', /^language-./, 'math-inline', 'math-display']],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
    div: [...(defaultSchema.attributes?.div ?? []), 'className']
  }
}

// `displayMode` and `throwOnError` are owned by rehype-katex and must not be passed.
export const katexOptions = {
  // 'warn' (the default) console.warn()s on every keystroke of the 150 ms debounce.
  strict: 'ignore' as const,
  errorColor: 'var(--color-math-error)',
  // Must stay false: rehype-katex runs *after* rehype-sanitize, so nothing
  // re-sanitizes its output. `trust: true` would re-enable \href{javascript:…}.
  trust: false,
  maxSize: 500
}

/**
 * Everything the live preview and the PDF export must agree on, ending in a hast tree.
 * Both consumers build on this, so markdown semantics can never drift between what
 * you see on screen and what you get in the exported document.
 */
export function createBaseProcessor(): Processor {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, sanitizeSchema)
    // After sanitize: KaTeX builds its own markup from a plain text string, so its
    // output is trusted — sanitizing it would strip the inline styles it lays out with.
    .use(rehypeKatex, katexOptions)
}

import { unified, type Processor } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeKatex from 'rehype-katex'
import rehypeReact, { type Options as RehypeReactOptions } from 'rehype-react'
import { jsx, jsxs, Fragment } from 'react/jsx-runtime'
import type { ComponentPropsWithoutRef } from 'react'
import CodeBlock from '../components/preview/CodeBlock'
import PreviewHeading from '../components/preview/PreviewHeading'
import PreviewImage from '../components/preview/PreviewImage'

const sanitizeSchema = {
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
const katexOptions = {
  // 'warn' (the default) console.warn()s on every keystroke of the 150 ms debounce.
  strict: 'ignore' as const,
  errorColor: 'var(--color-math-error)',
  // Must stay false: rehype-katex runs *after* rehype-sanitize, so nothing
  // re-sanitizes its output. `trust: true` would re-enable \href{javascript:…}.
  trust: false,
  maxSize: 500
}

const rehypeReactOptions: RehypeReactOptions = {
  jsx,
  jsxs,
  Fragment,
  // KaTeX emits dense inline styles; the default here is to *throw* on one it can't
  // parse, which would land in useMarkdownProcessor's silent catch and blank the preview.
  ignoreInvalidStyle: true,
  components: {
    pre: (props: ComponentPropsWithoutRef<'pre'>) => <CodeBlock {...props} />,
    h1: (props: ComponentPropsWithoutRef<'h1'>) => <PreviewHeading level={1} {...props} />,
    h2: (props: ComponentPropsWithoutRef<'h2'>) => <PreviewHeading level={2} {...props} />,
    h3: (props: ComponentPropsWithoutRef<'h3'>) => <PreviewHeading level={3} {...props} />,
    h4: (props: ComponentPropsWithoutRef<'h4'>) => <PreviewHeading level={4} {...props} />,
    h5: (props: ComponentPropsWithoutRef<'h5'>) => <PreviewHeading level={5} {...props} />,
    h6: (props: ComponentPropsWithoutRef<'h6'>) => <PreviewHeading level={6} {...props} />,
    img: (props: ComponentPropsWithoutRef<'img'>) => <PreviewImage {...props} />
  } as RehypeReactOptions['components']
}

export function createProcessor(): Processor {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, sanitizeSchema)
    // After sanitize: KaTeX builds its own markup from a plain text string, so its
    // output is trusted — sanitizing it would strip the inline styles it lays out with.
    .use(rehypeKatex, katexOptions)
    .use(rehypeReact, rehypeReactOptions)
}

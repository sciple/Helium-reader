import { unified, type Processor } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
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
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
    div: [...(defaultSchema.attributes?.div ?? []), 'className']
  }
}

const rehypeReactOptions: RehypeReactOptions = {
  jsx,
  jsxs,
  Fragment,
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
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeReact, rehypeReactOptions)
}

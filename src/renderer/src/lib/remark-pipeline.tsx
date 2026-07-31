import { type Processor } from 'unified'
import rehypeReact, { type Options as RehypeReactOptions } from 'rehype-react'
import { jsx, jsxs, Fragment } from 'react/jsx-runtime'
import type { ComponentPropsWithoutRef } from 'react'
import { createBaseProcessor } from './markdown/pipeline-base'
import CodeBlock from '../components/preview/CodeBlock'
import PreviewHeading from '../components/preview/PreviewHeading'
import PreviewImage from '../components/preview/PreviewImage'

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

/** The live preview: shared markdown semantics, rendered to a React element tree. */
export function createProcessor(): Processor {
  return createBaseProcessor().use(rehypeReact, rehypeReactOptions)
}

import type { ComponentPropsWithoutRef } from 'react'
import { slugify } from '../../lib/slugify'

interface Props extends ComponentPropsWithoutRef<'h1'> {
  level: 1 | 2 | 3 | 4 | 5 | 6
}

export default function PreviewHeading({ level, children, ...rest }: Props) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  const id = typeof children === 'string' ? slugify(children) : undefined
  return (
    <Tag id={id} {...rest}>
      {children}
    </Tag>
  )
}

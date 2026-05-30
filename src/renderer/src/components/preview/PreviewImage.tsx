import type { ComponentPropsWithoutRef } from 'react'
import { convertFileSrc } from '@tauri-apps/api/core'
import { useFileSystemStore } from '../../store/fileSystemStore'

type Props = ComponentPropsWithoutRef<'img'>

export default function PreviewImage({ src, alt, ...rest }: Props) {
  const rootPath = useFileSystemStore((s) => s.rootPath)

  let resolvedSrc = src ?? ''
  if (src && !/^(https?:|data:)/.test(src) && rootPath) {
    const abs = `${rootPath}/${src}`.replace(/\/{2,}/g, '/')
    resolvedSrc = convertFileSrc(abs)
  }

  return <img src={resolvedSrc} alt={alt} {...rest} style={{ maxWidth: '100%' }} />
}

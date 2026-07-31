import type { ComponentPropsWithoutRef } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useFileSystemStore } from '../../store/fileSystemStore'
import { dirOf, resolveAssetSrc } from '../../lib/mediaImages'

type Props = ComponentPropsWithoutRef<'img'>

export default function PreviewImage({ src, alt, ...rest }: Props) {
  const rootPath = useFileSystemStore((s) => s.rootPath)
  const currentFilePath = useEditorStore((s) => s.currentFilePath)

  // Read through the hooks rather than currentBaseDir(), so the preview re-renders
  // when the open file changes. Same fallback order as currentBaseDir().
  const baseDir = currentFilePath ? dirOf(currentFilePath) : rootPath

  return <img src={resolveAssetSrc(src, baseDir)} alt={alt} {...rest} style={{ maxWidth: '100%' }} />
}

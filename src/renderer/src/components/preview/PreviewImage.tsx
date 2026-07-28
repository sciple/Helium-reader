import type { ComponentPropsWithoutRef } from 'react'
import { convertFileSrc } from '@tauri-apps/api/core'
import { useEditorStore } from '../../store/editorStore'
import { useFileSystemStore } from '../../store/fileSystemStore'
import { dirOf } from '../../lib/mediaImages'

type Props = ComponentPropsWithoutRef<'img'>

/** Schemes and absolute paths that must be passed through untouched. */
const NON_RELATIVE = /^(?:[a-z][a-z0-9+.-]*:|\/|[a-zA-Z]:\/)/

/** Collapse . and .. segments, so "../media/shot.png" resolves correctly. */
function normalizeSegments(path: string): string {
  const out: string[] = []
  for (const segment of path.split('/')) {
    if (segment === '.' || segment === '') continue
    if (segment === '..') out.pop()
    else out.push(segment)
  }
  return out.join('/')
}

export default function PreviewImage({ src, alt, ...rest }: Props) {
  const rootPath = useFileSystemStore((s) => s.rootPath)
  const currentFilePath = useEditorStore((s) => s.currentFilePath)

  // Relative sources resolve against the document's own folder, falling back
  // to the vault root when there is no file open yet.
  const baseDir = currentFilePath ? dirOf(currentFilePath) : rootPath

  let resolvedSrc = src ?? ''
  if (src && !NON_RELATIVE.test(src) && baseDir) {
    let decoded = src
    try {
      decoded = decodeURIComponent(src)
    } catch {
      // Malformed escape in a hand-written link — use it verbatim.
    }
    resolvedSrc = convertFileSrc(normalizeSegments(`${baseDir}/${decoded}`))
  }

  return <img src={resolvedSrc} alt={alt} {...rest} style={{ maxWidth: '100%' }} />
}

import { useEditorStore } from '../store/editorStore'
import { useFileSystemStore } from '../store/fileSystemStore'

/** Folder name, relative to the vault root, where dropped/pasted images are stored. */
export const MEDIA_DIR_NAME = 'media'

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
}

export function extensionForMime(mime: string): string {
  return MIME_EXTENSIONS[mime.toLowerCase()] ?? 'png'
}

/** Base64-encode in chunks — a multi-MB screenshot would blow the argument stack in one call. */
export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  const CHUNK = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/** Name for a clipboard image, which arrives without one: pasted-YYYYMMDD-HHMMSS. */
export function timestampName(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `pasted-${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  )
}

/** Directory portion of a forward-slashed absolute path. */
export function dirOf(path: string): string {
  const i = path.lastIndexOf('/')
  return i > 0 ? path.slice(0, i) : path
}

/** Percent-encode the characters that would break a markdown link target. */
function encodeLinkTarget(path: string): string {
  return encodeURI(path)
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/#/g, '%23')
    .replace(/\?/g, '%3F')
}

/**
 * Markdown-ready link from `fromDir` to `toFile`, both forward-slashed absolutes.
 * Both derive from the same blessed root, so they always share a drive.
 */
export function relativeLink(fromDir: string, toFile: string): string {
  const from = fromDir.replace(/\/+$/, '').split('/')
  const to = toFile.split('/')

  let common = 0
  while (common < from.length && common < to.length && from[common] === to[common]) {
    common++
  }

  const up = from.length - common
  const segments = [...Array<string>(up).fill('..'), ...to.slice(common)]
  return encodeLinkTarget(segments.join('/'))
}

/** Where images for the current document are stored, or null if nothing is open. */
export function resolveMediaDir(): string | null {
  const root = useFileSystemStore.getState().rootPath
  if (root) return `${root}/${MEDIA_DIR_NAME}`

  // No folder open: fall back to the folder holding the current file.
  const filePath = useEditorStore.getState().currentFilePath
  if (filePath) return `${dirOf(filePath)}/${MEDIA_DIR_NAME}`

  return null
}

/**
 * Copy an image into the media folder and return the markdown that links to it.
 * `suggestedName` is the dropped file's name, or null for clipboard images.
 */
export async function saveImageAndBuildMarkdown(
  blob: Blob,
  suggestedName: string | null
): Promise<string> {
  const mediaDir = resolveMediaDir()
  if (!mediaDir) {
    throw new Error('Open a folder or save this file before adding images.')
  }

  const fileName = suggestedName ?? `${timestampName()}.${extensionForMime(blob.type)}`
  const data = arrayBufferToBase64(await blob.arrayBuffer())

  const saved = await window.api.saveMediaImage(mediaDir, fileName, data)

  // Link relative to the document, which may sit in a subfolder of the root.
  const filePath = useEditorStore.getState().currentFilePath
  const docDir = filePath ? dirOf(filePath) : dirOf(mediaDir)

  const alt = saved.fileName.replace(/\.[^.]+$/, '')
  return `![${alt}](${relativeLink(docDir, saved.path)})`
}

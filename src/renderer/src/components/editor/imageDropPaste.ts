import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import { saveImageAndBuildMarkdown } from '../../lib/mediaImages'
import { notify } from '../../lib/notice'

const DROP_ACTIVE_CLASS = 'cm-image-drop-active'

/** Chromium names raw clipboard bitmaps generically — treat those as unnamed. */
const GENERIC_CLIPBOARD_NAME = /^image\.(png|jpe?g|webp)$/i

interface PendingImage {
  blob: Blob
  /** null → a timestamp name is generated instead. */
  name: string | null
}

function droppedImages(list: FileList | null | undefined): PendingImage[] {
  if (!list) return []
  return Array.from(list)
    .filter((f) => f.type.startsWith('image/'))
    .map((f) => ({ blob: f, name: f.name || null }))
}

function pastedImages(data: DataTransfer): PendingImage[] {
  return Array.from(data.items)
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((f): f is File => f !== null)
    .map((f) => ({
      blob: f,
      name: !f.name || GENERIC_CLIPBOARD_NAME.test(f.name) ? null : f.name,
    }))
}

/**
 * Save each image, then insert all the links in one dispatch so the whole
 * insertion is a single undo step.
 */
async function insertImages(
  view: EditorView,
  from: number,
  to: number,
  images: PendingImage[]
): Promise<void> {
  try {
    const parts: string[] = []
    for (const image of images) {
      parts.push(await saveImageAndBuildMarkdown(image.blob, image.name))
    }
    const markdown = parts.join('\n')

    // The document may have changed while we were writing to disk.
    const max = view.state.doc.length
    const start = Math.min(from, max)
    const end = Math.min(Math.max(to, start), max)

    view.dispatch({
      changes: { from: start, to: end, insert: markdown },
      selection: { anchor: start + markdown.length },
    })
    view.focus()
  } catch (err) {
    console.error('[image] failed to save dropped/pasted image', err)
    notify(typeof err === 'string' ? err : err instanceof Error ? err.message : String(err))
  }
}

/**
 * Drop an image file onto the editor, or paste one from the clipboard
 * (e.g. straight out of the Snipping Tool): the bytes are copied into the
 * media folder and markdown image syntax is inserted at the drop point.
 */
export function imageDropPaste(): Extension {
  return EditorView.domEventHandlers({
    dragover(event, view) {
      if (!event.dataTransfer?.types.includes('Files')) return false
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
      view.dom.classList.add(DROP_ACTIVE_CLASS)
      return true
    },

    dragleave(event, view) {
      // Also fires when crossing into a child element — ignore those.
      const next = event.relatedTarget as Node | null
      if (next && view.dom.contains(next)) return false
      view.dom.classList.remove(DROP_ACTIVE_CLASS)
      return false
    },

    drop(event, view) {
      view.dom.classList.remove(DROP_ACTIVE_CLASS)

      const images = droppedImages(event.dataTransfer?.files)
      if (images.length === 0) return false // let CodeMirror handle text drops

      event.preventDefault()
      const pos =
        view.posAtCoords({ x: event.clientX, y: event.clientY }) ??
        view.state.selection.main.head
      void insertImages(view, pos, pos, images)
      return true
    },

    paste(event, view) {
      const data = event.clipboardData
      if (!data) return false

      // A real text copy wins — don't hijack pasting rich content from a browser.
      if (data.getData('text/plain').trim().length > 0) return false

      const images = pastedImages(data)
      if (images.length === 0) return false

      event.preventDefault()
      const { from, to } = view.state.selection.main
      void insertImages(view, from, to, images)
      return true
    },
  })
}

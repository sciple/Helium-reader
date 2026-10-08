import { useEditorStore } from '../store/editorStore'
import { notify } from './notice'

/**
 * Ask what to do with unsaved edits before the open document is replaced or
 * the window closes. Resolves true when it is safe to go ahead: there were no
 * edits, the user chose Don't Save, or the save succeeded. Resolves false on
 * Cancel, on a cancelled Save As, or when the save fails.
 */
export async function confirmUnsavedChanges(): Promise<boolean> {
  const { isDirty, currentFilePath } = useEditorStore.getState()
  if (!isDirty) return true

  const name = currentFilePath?.split('/').pop() ?? 'Untitled'
  const choice = await window.api.confirmDiscard(name)
  if (choice === 'cancel') return false
  if (choice === 'discard') return true

  const { content, markSaved } = useEditorStore.getState()
  const path = currentFilePath ?? (await window.api.saveAsDialog('untitled.md'))
  if (!path) return false
  try {
    await window.api.writeFile(path, content)
  } catch (err) {
    notify(`Could not save ${name}: ${String(err)}`)
    return false
  }
  markSaved(path)
  return true
}

import { useEffect } from 'react'
import AppShell from './components/layout/AppShell'
import { useEditorStore } from './store/editorStore'
import { useUiStore } from './store/uiStore'
import { useFileSystem } from './hooks/useFileSystem'
import { useFocusMode } from './hooks/useFocusMode'

export default function App() {
  useFocusMode()
  const { openFolder } = useFileSystem()
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const toggleFocusMode = useUiStore((s) => s.toggleFocusMode)
  const togglePreview = useUiStore((s) => s.togglePreview)
  const requestNewFile = useUiStore((s) => s.requestNewFile)
  const colorTheme = useUiStore((s) => s.colorTheme)

  // Apply data-theme attribute so CSS variables switch
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme)
  }, [colorTheme])

  useEffect(() => {
    const handleSave = async () => {
      const { currentFilePath, content, markSaved } = useEditorStore.getState()
      if (!currentFilePath) {
        const path = await window.api.saveAsDialog('untitled.md')
        if (!path) return
        await window.api.writeFile(path, content)
        markSaved(path)
        window.api.setWindowTitle(`${path.split('/').pop()} — Helium Reader`)
        return
      }
      await window.api.writeFile(currentFilePath, content)
      markSaved()
    }

    const handleSaveAs = async () => {
      const { currentFilePath, content, markSaved } = useEditorStore.getState()
      const path = await window.api.saveAsDialog(currentFilePath ?? 'untitled.md')
      if (!path) return
      await window.api.writeFile(path, content)
      markSaved(path)
      window.api.setWindowTitle(`${path.split('/').pop()} — Helium Reader`)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (e.shiftKey) handleSaveAs()
        else handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault()
        togglePreview()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('menu:new-file', requestNewFile)
    window.addEventListener('menu:open-folder', openFolder)
    window.addEventListener('menu:save', handleSave)
    window.addEventListener('menu:save-as', handleSaveAs)
    window.addEventListener('menu:toggle-sidebar', toggleSidebar)
    window.addEventListener('menu:toggle-focus', toggleFocusMode)
    window.addEventListener('menu:toggle-preview', togglePreview)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('menu:new-file', requestNewFile)
      window.removeEventListener('menu:open-folder', openFolder)
      window.removeEventListener('menu:save', handleSave)
      window.removeEventListener('menu:save-as', handleSaveAs)
      window.removeEventListener('menu:toggle-sidebar', toggleSidebar)
      window.removeEventListener('menu:toggle-focus', toggleFocusMode)
      window.removeEventListener('menu:toggle-preview', togglePreview)
    }
  }, [openFolder, toggleSidebar, toggleFocusMode, togglePreview, requestNewFile])

  return <AppShell />
}

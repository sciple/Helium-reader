import { useEffect, useRef } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { buildExtensions, themeCompartment } from './extensions'
import { getThemeExtensions } from '../../styles/codemirror-theme'
import { useEditorStore } from '../../store/editorStore'
import { useUiStore } from '../../store/uiStore'

export function useCodeMirror(containerRef: React.RefObject<HTMLDivElement | null>) {
  const viewRef = useRef<EditorView | null>(null)
  const content = useEditorStore((s) => s.content)
  const currentFilePath = useEditorStore((s) => s.currentFilePath)
  const colorTheme = useUiStore((s) => s.colorTheme)

  // Initialize CM once
  useEffect(() => {
    if (!containerRef.current || viewRef.current) return

    const view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: buildExtensions(
          (value) => useEditorStore.getState().updateContent(value),
          (size, text) => useEditorStore.getState().updateSelection(size, text),
          useUiStore.getState().colorTheme === 'dark'
        )
      }),
      parent: containerRef.current
    })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])

  // Focus the editor in response to keyboard navigation from other panels
  useEffect(() => {
    const handler = () => viewRef.current?.focus()
    window.addEventListener('focus-editor', handler)
    return () => window.removeEventListener('focus-editor', handler)
  }, [])

  // Replace current selection with text from the transform panel
  useEffect(() => {
    const handler = (e: Event) => {
      const view = viewRef.current
      if (!view) return
      const text = (e as CustomEvent<string>).detail
      const { from, to } = view.state.selection.main
      view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from } })
      view.focus()
    }
    window.addEventListener('editor:replace-selection', handler)
    return () => window.removeEventListener('editor:replace-selection', handler)
  }, [])

  // Scroll editor to a heading when an outline item is clicked
  useEffect(() => {
    const handler = (e: Event) => {
      const view = viewRef.current
      if (!view) return
      const { text, level } = (e as CustomEvent<{ text: string; level: number }>).detail
      const prefix = '#'.repeat(level) + ' '
      const doc = view.state.doc
      let pos = 0
      for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i)
        if (line.text.startsWith(prefix) && line.text.slice(prefix.length).trim() === text.trim()) {
          view.dispatch({ effects: EditorView.scrollIntoView(line.from, { y: 'start', yMargin: 40 }) })
          break
        }
        pos = line.to + 1
      }
    }
    window.addEventListener('editor:scroll-to-heading', handler)
    return () => window.removeEventListener('editor:scroll-to-heading', handler)
  }, [])

  // Swap CM theme when colorTheme changes
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: themeCompartment.reconfigure(getThemeExtensions(colorTheme === 'dark'))
    })
  }, [colorTheme])

  // Sync external content changes (file open) without triggering the updateListener
  const lastExternalPath = useRef<string | null>(null)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    if (currentFilePath === lastExternalPath.current) return
    lastExternalPath.current = currentFilePath

    const currentDoc = view.state.doc.toString()
    if (currentDoc !== content) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: content }
      })
    }
  }, [currentFilePath, content])
}

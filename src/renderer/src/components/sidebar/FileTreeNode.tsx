import './FileTreeNode.css'
import { useState, useRef, useEffect } from 'react'
import type { FileEntry } from '@shared/types'
import { useEditorStore } from '../../store/editorStore'

interface Props {
  node: FileEntry
  depth?: number
}

export default function FileTreeNode({ node, depth = 0 }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<FileEntry[]>(node.children ?? [])
  const [isCreating, setIsCreating] = useState(false)
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const currentFilePath = useEditorStore((s) => s.currentFilePath)
  const isDirty = useEditorStore((s) => s.isDirty)
  const createInputRef = useRef<HTMLInputElement>(null)
  const createFileInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isCreating) createInputRef.current?.focus()
  }, [isCreating])

  useEffect(() => {
    if (isCreatingFile) createFileInputRef.current?.focus()
  }, [isCreatingFile])

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [isRenaming])

  const handleClick = async () => {
    if (node.isDirectory) {
      if (!expanded && children.length === 0) {
        const loaded = await window.api.readDirectory(node.path, 1)
        setChildren(loaded)
      }
      setExpanded((v) => !v)
    } else {
      if (isDirty && currentFilePath && currentFilePath !== node.path) {
        const store = useEditorStore.getState()
        const currentName = currentFilePath.split('/').pop() ?? 'Untitled'
        const choice = await window.api.confirmDiscard(currentName)
        if (choice === 'cancel') return
        if (choice === 'save') {
          await window.api.writeFile(currentFilePath, store.content)
          store.markSaved()
        }
      }
      const result = await window.api.readFile(node.path)
      useEditorStore.getState().openFile(result.path, result.content)
      window.api.setWindowTitle(`${node.name} — Helium Reader`)
    }
  }

  const expandDir = async () => {
    if (!expanded) {
      if (children.length === 0) {
        const loaded = await window.api.readDirectory(node.path, 1)
        setChildren(loaded)
      }
      setExpanded(true)
    }
  }

  const handleNewFolder = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await expandDir()
    setIsCreating(true)
  }

  const handleNewFile = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await expandDir()
    setIsCreatingFile(true)
  }

  const handleCreate = async (name: string) => {
    const trimmed = name.trim()
    if (trimmed) {
      await window.api.createDirectory(`${node.path}/${trimmed}`)
    }
    setIsCreating(false)
  }

  const handleCreateFile = async (name: string) => {
    const trimmed = name.trim()
    if (trimmed) {
      const fileName = trimmed.endsWith('.md') || trimmed.endsWith('.markdown') ? trimmed : `${trimmed}.md`
      const filePath = `${node.path}/${fileName}`
      try {
        await window.api.createFile(filePath)
      } catch { /* already exists */ }
      const result = await window.api.readFile(filePath)
      useEditorStore.getState().openFile(result.path, result.content)
      window.api.setWindowTitle(`${fileName} — Helium Reader`)
    }
    setIsCreatingFile(false)
  }

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const action = await window.api.showFileContextMenu(node.path)
    if (action === 'rename') setIsRenaming(true)
  }

  const handleRename = async (newName: string) => {
    const trimmed = newName.trim()
    setIsRenaming(false)
    if (!trimmed || trimmed === node.name) return
    const parentPath = node.path.substring(0, node.path.lastIndexOf('/'))
    const newPath = `${parentPath}/${trimmed}`
    await window.api.renameFile(node.path, newPath)
    // If the renamed file was open, update the editor path
    if (currentFilePath === node.path) {
      useEditorStore.getState().openFile(newPath, useEditorStore.getState().content)
      window.api.setWindowTitle(`${trimmed} — Helium Reader`)
    }
  }

  const isActive = !node.isDirectory && currentFilePath === node.path
  const indentPx = 8 + depth * 16

  return (
    <div className="file-tree-node">
      {isRenaming ? (
        <div className="file-tree-node__row file-tree-node__row--creating" style={{ paddingLeft: `${indentPx}px` }}>
          <span className="file-tree-node__icon">{node.isDirectory ? '▸' : ''}</span>
          <input
            ref={renameInputRef}
            className="file-tree__new-folder-input"
            defaultValue={node.name}
            onBlur={(e) => handleRename(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename((e.target as HTMLInputElement).value)
              if (e.key === 'Escape') setIsRenaming(false)
            }}
          />
        </div>
      ) : (
      <div
        className={`file-tree-node__row ${isActive ? 'file-tree-node__row--active' : ''}`}
        style={{ paddingLeft: `${indentPx}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        <span className="file-tree-node__icon">
          {node.isDirectory ? (expanded ? '▾' : '▸') : ''}
        </span>
        <span className="file-tree-node__name">{node.name}</span>
        {node.isDirectory && (
          <>
            <button
              className="file-tree-node__add-btn"
              title="New file"
              aria-label="New file"
              onClick={handleNewFile}
            >
              ≡+
            </button>
            <button
              className="file-tree-node__add-btn"
              title="New subfolder"
              aria-label="New subfolder"
              onClick={handleNewFolder}
            >
              +
            </button>
          </>
        )}
      </div>
      )}
      {node.isDirectory && expanded && (
        <div>
          {isCreatingFile && (
            <div className="file-tree-node__row file-tree-node__row--creating" style={{ paddingLeft: `${indentPx + 16}px` }}>
              <span className="file-tree-node__icon"></span>
              <input
                ref={createFileInputRef}
                className="file-tree__new-folder-input"
                placeholder="filename.md"
                onBlur={(e) => handleCreateFile(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFile((e.target as HTMLInputElement).value)
                  if (e.key === 'Escape') setIsCreatingFile(false)
                }}
              />
            </div>
          )}
          {isCreating && (
            <div className="file-tree-node__row file-tree-node__row--creating" style={{ paddingLeft: `${indentPx + 16}px` }}>
              <span className="file-tree-node__icon">▸</span>
              <input
                ref={createInputRef}
                className="file-tree__new-folder-input"
                placeholder="folder name"
                onBlur={(e) => handleCreate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate((e.target as HTMLInputElement).value)
                  if (e.key === 'Escape') setIsCreating(false)
                }}
              />
            </div>
          )}
          {children.map((child) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

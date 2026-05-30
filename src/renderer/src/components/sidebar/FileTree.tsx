import './FileTree.css'
import { useRef, useEffect } from 'react'
import { useFileSystemStore } from '../../store/fileSystemStore'
import { useEditorStore } from '../../store/editorStore'
import FileTreeNode from './FileTreeNode'
import { useWatcher } from '../../hooks/useWatcher'

interface Props {
  creatingAtRoot: boolean
  onRootCreateDone: () => void
  creatingFileAtRoot: boolean
  onRootFileCreateDone: () => void
}

export default function FileTree({ creatingAtRoot, onRootCreateDone, creatingFileAtRoot, onRootFileCreateDone }: Props) {
  const tree = useFileSystemStore((s) => s.tree)
  const rootPath = useFileSystemStore((s) => s.rootPath)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  useWatcher(rootPath)

  useEffect(() => {
    if (creatingAtRoot) folderInputRef.current?.focus()
  }, [creatingAtRoot])

  useEffect(() => {
    if (creatingFileAtRoot) fileInputRef.current?.focus()
  }, [creatingFileAtRoot])

  const handleRootCreate = async (name: string) => {
    const trimmed = name.trim()
    if (trimmed && rootPath) {
      await window.api.createDirectory(`${rootPath}/${trimmed}`)
    }
    onRootCreateDone()
  }

  const handleRootFileCreate = async (name: string) => {
    const trimmed = name.trim()
    if (trimmed && rootPath) {
      const fileName = trimmed.endsWith('.md') || trimmed.endsWith('.markdown') ? trimmed : `${trimmed}.md`
      const filePath = `${rootPath}/${fileName}`
      try {
        await window.api.createFile(filePath)
        const result = await window.api.readFile(filePath)
        useEditorStore.getState().openFile(result.path, result.content)
        window.api.setWindowTitle(`${fileName} — Helium Reader`)
      } catch {
        // file already exists — open it
        try {
          const result = await window.api.readFile(`${rootPath}/${trimmed.endsWith('.md') || trimmed.endsWith('.markdown') ? trimmed : `${trimmed}.md`}`)
          useEditorStore.getState().openFile(result.path, result.content)
        } catch { /* ignore */ }
      }
    }
    onRootFileCreateDone()
  }

  return (
    <div className="file-tree">
      {creatingFileAtRoot && (
        <div className="file-tree__new-folder-row" style={{ paddingLeft: '8px' }}>
          <span className="file-tree-node__icon"></span>
          <input
            ref={fileInputRef}
            className="file-tree__new-folder-input"
            placeholder="filename.md"
            onBlur={(e) => handleRootFileCreate(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRootFileCreate((e.target as HTMLInputElement).value)
              if (e.key === 'Escape') onRootFileCreateDone()
            }}
          />
        </div>
      )}
      {creatingAtRoot && (
        <div className="file-tree__new-folder-row" style={{ paddingLeft: '8px' }}>
          <span className="file-tree-node__icon">▸</span>
          <input
            ref={folderInputRef}
            className="file-tree__new-folder-input"
            placeholder="folder name"
            onBlur={(e) => handleRootCreate(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRootCreate((e.target as HTMLInputElement).value)
              if (e.key === 'Escape') onRootCreateDone()
            }}
          />
        </div>
      )}
      {tree.map((node) => (
        <FileTreeNode key={node.path} node={node} />
      ))}
    </div>
  )
}

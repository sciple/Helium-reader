import './Sidebar.css'
import { useState, useEffect } from 'react'
import { useFileSystemStore } from '../../store/fileSystemStore'
import { useFileSystem } from '../../hooks/useFileSystem'
import { useUiStore } from '../../store/uiStore'
import FolderPicker from '../sidebar/FolderPicker'
import FileTree from '../sidebar/FileTree'

export default function Sidebar() {
  const rootPath = useFileSystemStore((s) => s.rootPath)
  const { openFolder } = useFileSystem()
  const [creatingAtRoot, setCreatingAtRoot] = useState(false)
  const [creatingFileAtRoot, setCreatingFileAtRoot] = useState(false)
  const newFileRequested = useUiStore((s) => s.newFileRequested)
  const clearNewFileRequest = useUiStore((s) => s.clearNewFileRequest)
  const setSidebarVisible = useUiStore((s) => s.setSidebarVisible)

  useEffect(() => {
    if (newFileRequested && rootPath) {
      setSidebarVisible(true)
      setCreatingFileAtRoot(true)
      clearNewFileRequest()
    } else if (newFileRequested) {
      clearNewFileRequest()
    }
  }, [newFileRequested, rootPath, clearNewFileRequest, setSidebarVisible])

  const folderName = rootPath ? rootPath.split('/').pop() ?? rootPath : null

  return (
    <div className="sidebar">
      {rootPath ? (
        <>
          <div className="sidebar__header">
            <span className="sidebar__folder-name" title={rootPath}>{folderName}</span>
            <div className="sidebar__header-actions">
              <button
                className="sidebar__icon-btn"
                title="New file"
                aria-label="New file"
                onClick={() => setCreatingFileAtRoot(true)}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M3 1.5H7.5L11 5V11.5H3V1.5Z" stroke="currentColor" strokeWidth="1.1" fill="none"/>
                  <path d="M7.5 1.5V5H11" stroke="currentColor" strokeWidth="1.1" fill="none"/>
                  <line x1="5" y1="7.5" x2="9" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="7" y1="5.5" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
              <button
                className="sidebar__icon-btn"
                title="New subfolder"
                aria-label="New subfolder"
                onClick={() => setCreatingAtRoot(true)}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2H5l1.5 1.5H11A1.5 1.5 0 0 1 12.5 5v5A1.5 1.5 0 0 1 11 11.5H2.5A1.5 1.5 0 0 1 1 10V3.5Z" stroke="currentColor" strokeWidth="1.1" fill="none"/>
                  <line x1="6.5" y1="6.5" x2="6.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="5" y1="8" x2="8" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
              <button
                className="sidebar__icon-btn"
                title="Open different folder"
                aria-label="Open different folder"
                onClick={openFolder}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2H5l1.5 1.5H11A1.5 1.5 0 0 1 12.5 5v5A1.5 1.5 0 0 1 11 11.5H2.5A1.5 1.5 0 0 1 1 10V3.5Z" stroke="currentColor" strokeWidth="1.1" fill="none"/>
                </svg>
              </button>
            </div>
          </div>
          <FileTree
            creatingAtRoot={creatingAtRoot}
            onRootCreateDone={() => setCreatingAtRoot(false)}
            creatingFileAtRoot={creatingFileAtRoot}
            onRootFileCreateDone={() => setCreatingFileAtRoot(false)}
          />
        </>
      ) : (
        <FolderPicker />
      )}
    </div>
  )
}

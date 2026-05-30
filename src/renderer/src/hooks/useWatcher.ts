import { useEffect } from 'react'
import { useFileSystemStore } from '../store/fileSystemStore'
import { useFileSystem } from './useFileSystem'

export function useWatcher(rootPath: string | null) {
  const applyWatchEvent = useFileSystemStore((s) => s.applyWatchEvent)
  const { refreshTree } = useFileSystem()

  useEffect(() => {
    if (!rootPath) return

    const unsubscribe = window.api.onFileChanged((payload) => {
      applyWatchEvent(payload)
      if (payload.event === 'add' || payload.event === 'unlink') {
        refreshTree(rootPath)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [rootPath])
}

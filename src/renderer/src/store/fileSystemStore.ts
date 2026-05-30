import { create } from 'zustand'
import type { FileEntry, FileChangedPayload } from '@shared/types'

interface FileSystemState {
  rootPath: string | null
  tree: FileEntry[]
  setRoot: (path: string) => void
  setTree: (tree: FileEntry[]) => void
  applyWatchEvent: (payload: FileChangedPayload) => void
}

function removeFromTree(tree: FileEntry[], filePath: string): FileEntry[] {
  return tree
    .filter((e) => e.path !== filePath)
    .map((e) =>
      e.isDirectory && e.children
        ? { ...e, children: removeFromTree(e.children, filePath) }
        : e
    )
}

export const useFileSystemStore = create<FileSystemState>((set) => ({
  rootPath: null,
  tree: [],

  setRoot: (path) => set({ rootPath: path }),
  setTree: (tree) => set({ tree }),

  applyWatchEvent: ({ path, event }) => {
    set((s) => {
      if (event === 'unlink') {
        return { tree: removeFromTree(s.tree, path) }
      }
      // For add/change we just trigger a reload signal — a full re-read is done by useWatcher
      return s
    })
  }
}))

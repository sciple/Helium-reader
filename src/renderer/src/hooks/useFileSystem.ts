import { useFileSystemStore } from '../store/fileSystemStore'

export function useFileSystem() {
  const setRoot = useFileSystemStore((s) => s.setRoot)
  const setTree = useFileSystemStore((s) => s.setTree)

  const openFolder = async () => {
    const folderPath = await window.api.openFolderDialog()
    if (!folderPath) return
    setRoot(folderPath)
    const tree = await window.api.readDirectory(folderPath, 2)
    setTree(tree)
    await window.api.watchFolder(folderPath)
  }

  const refreshTree = async (rootPath: string) => {
    const tree = await window.api.readDirectory(rootPath, 2)
    setTree(tree)
  }

  return { openFolder, refreshTree }
}

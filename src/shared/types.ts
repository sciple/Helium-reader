export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  children?: FileEntry[]
}

export interface ReadFileResult {
  content: string
  path: string
  mtime: number
}

export interface WriteFileResult {
  success: boolean
  path: string
}

export interface FileChangedPayload {
  path: string
  event: 'add' | 'change' | 'unlink'
}

export type ConfirmDiscardResult = 'save' | 'discard' | 'cancel'

export interface ChatApiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatUsage {
  promptTokens: number
  completionTokens: number
}

export interface WindowApi {
  chat: {
    send: (payload: { url: string; model: string; messages: ChatApiMessage[] }) => void
    abort: () => void
    onChunk: (cb: (delta: string) => void) => () => void
    onDone: (cb: () => void) => () => void
    onError: (cb: (message: string) => void) => () => void
    onUsage: (cb: (usage: ChatUsage) => void) => () => void
  }
  openFolderDialog: () => Promise<string | null>
  readDirectory: (path: string, depth: number) => Promise<FileEntry[]>
  readFile: (path: string) => Promise<ReadFileResult>
  writeFile: (path: string, content: string) => Promise<WriteFileResult>
  watchFolder: (path: string) => Promise<void>
  unwatchFolder: (path: string) => Promise<void>
  onFileChanged: (cb: (payload: FileChangedPayload) => void) => () => void
  setWindowTitle: (title: string) => Promise<void>
  setFocusMode: (enabled: boolean) => Promise<void>
  saveAsDialog: (defaultPath: string) => Promise<string | null>
  confirmDiscard: (fileName: string) => Promise<ConfirmDiscardResult>
  createDirectory: (path: string) => Promise<void>
  createFile: (path: string) => Promise<{ path: string }>
  renameFile: (oldPath: string, newPath: string) => Promise<{ newPath: string }>
  showFileContextMenu: (path: string) => Promise<'rename' | null>
  windowControl: (action: 'minimize' | 'maximize' | 'close') => void
}

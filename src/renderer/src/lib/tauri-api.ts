import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type {
  WindowApi,
  FileEntry,
  ReadFileResult,
  WriteFileResult,
  FileChangedPayload,
  ConfirmDiscardResult,
  ChatUsage,
} from '@shared/types'

// Wrap Tauri's async listen() so callers get a synchronous unsubscribe fn back.
function wrapListen<T>(event: string, handler: (payload: T) => void): () => void {
  let unlisten: (() => void) | null = null
  const p = listen<T>(event, (e) => handler(e.payload))
  p.then((fn) => { unlisten = fn })
  return () => {
    if (unlisten) unlisten()
    else p.then((fn) => fn())
  }
}

const MENU_EVENTS = [
  'menu:new-file',
  'menu:open-folder',
  'menu:save',
  'menu:save-as',
  'menu:toggle-sidebar',
  'menu:toggle-focus',
  'menu:toggle-preview',
  'menu:toggle-chat',
] as const

// Register menu event forwarding once at module load.
// Tauri emits these as global events; re-dispatch as window CustomEvents so
// App.tsx event listeners (added with addEventListener) continue to work unchanged.
for (const name of MENU_EVENTS) {
  listen(name, () => window.dispatchEvent(new CustomEvent(name)))
}

const api: WindowApi = {
  chat: {
    // fire-and-forget: chat_send spawns a task; no return value needed
    send: ({ url, model, messages }) => {
      void invoke('chat_send', { url, model, messages })
    },
    abort: () => {
      void invoke('chat_abort')
    },
    onChunk: (cb) => wrapListen<string>('chat:chunk', cb),
    onDone: (cb) => wrapListen<null>('chat:done', () => cb()),
    onError: (cb) => wrapListen<string>('chat:error', cb),
    onUsage: (cb) => wrapListen<ChatUsage>('chat:usage', cb),
  },

  openFolderDialog: () =>
    invoke<string | null>('open_folder_dialog'),

  readDirectory: (path, depth) =>
    invoke<FileEntry[]>('read_directory', { path, depth }),

  readFile: (path) =>
    invoke<ReadFileResult>('read_file', { path }),

  writeFile: (path, content) =>
    invoke<WriteFileResult>('write_file', { path, content }),

  watchFolder: (path) =>
    invoke<void>('watch_folder', { path }),

  unwatchFolder: (path) =>
    invoke<void>('unwatch_folder', { path }),

  onFileChanged: (cb) => wrapListen<FileChangedPayload>('fs:changed', cb),

  setWindowTitle: (title) =>
    invoke<void>('set_window_title', { title }),

  setFocusMode: (enabled) =>
    invoke<void>('set_focus_mode', { enabled }),

  saveAsDialog: (defaultPath) =>
    invoke<string | null>('save_as_dialog', { defaultPath }),

  confirmDiscard: (fileName) =>
    invoke<ConfirmDiscardResult>('confirm_discard', { fileName }),

  createDirectory: (path) =>
    invoke<void>('create_directory', { path }),

  createFile: (path) =>
    invoke<{ path: string }>('create_file', { path }),

  renameFile: (oldPath, newPath) =>
    invoke<{ newPath: string }>('rename_file', { oldPath, newPath }),

  showFileContextMenu: (path) =>
    invoke<'rename' | null>('show_file_context_menu', { path }),

  // sync void: fire-and-forget (matches Electron's ipcRenderer.send)
  windowControl: (action) => {
    void invoke('window_control', { action })
  },
}

window.api = api

// Transform API — Tauri-native, not part of the Electron-origin WindowApi.
// Imported directly by transformStore; not on window.api.
export const transformApi = {
  send: (payload: { url: string; model: string; messages: { role: string; content: string }[] }) => {
    void invoke('transform_send', payload)
  },
  abort: () => { void invoke('transform_abort') },
  onChunk: (cb: (delta: string) => void) => wrapListen<string>('transform:chunk', cb),
  onDone:  (cb: () => void)              => wrapListen<null>('transform:done', () => cb()),
  onError: (cb: (msg: string) => void)   => wrapListen<string>('transform:error', cb),
}

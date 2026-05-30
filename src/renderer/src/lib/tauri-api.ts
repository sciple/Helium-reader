import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type {
  WindowApi,
  FileEntry,
  ReadFileResult,
  WriteFileResult,
  FileChangedPayload,
  ConfirmDiscardResult,
} from '@shared/types'

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
  // Chat is deferred — provide no-op stubs so the renderer mounts cleanly.
  chat: {
    send: () => {},
    abort: () => {},
    onChunk: () => () => {},
    onDone: () => () => {},
    onError: () => () => {},
    onUsage: () => () => {},
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

  onFileChanged: (cb) => {
    // Tauri's listen() is async; wrap to return a synchronous unsubscribe fn.
    let unlisten: (() => void) | null = null
    const promise = listen<FileChangedPayload>('fs:changed', (e) => cb(e.payload))
    promise.then((fn) => { unlisten = fn })
    return () => {
      if (unlisten) {
        unlisten()
      } else {
        promise.then((fn) => fn())
      }
    }
  },

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

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Helium Reader** — a Tauri 2 + React 19 + Rust desktop markdown editor for Windows. It combines a CodeMirror editor, live markdown preview, an AI chat sidebar, and an AI text-transform panel, all backed by a Rust process for file I/O, file watching, and HTTP streaming to a local LM Studio instance.

## Commands

```bash
# Full development (Vite dev server + Rust compilation)
npm run tauri dev

# Frontend only (Vite on port 5173)
npm run dev:renderer

# Production build → src-tauri/target/release/bundle/nsis/
npm run tauri build

# Type-check only
npx tsc --noEmit
```

There are no test or lint scripts. TypeScript strict mode is enabled.

## Architecture

### Frontend ↔ Backend Bridge

All cross-process calls go through Tauri `invoke()`. The typed wrappers live in [src/renderer/src/lib/tauri-api.ts](src/renderer/src/lib/tauri-api.ts) as a `window.api` object. Shared TypeScript/Rust types are in [src/shared/types.ts](src/shared/types.ts).

Native menu events (from [src-tauri/src/menu.rs](src-tauri/src/menu.rs)) are emitted as Tauri events and re-dispatched as `CustomEvent` on `window` in `tauri-api.ts`, so React listeners work unchanged.

### Rust Backend (`src-tauri/src/`)

| File | Responsibility |
|---|---|
| `commands/fs.rs` | File read/write/rename/delete, directory scan (markdown-only, sorted) |
| `commands/watcher.rs` | `notify-debouncer-full` watcher (150 ms debounce), emits `fs:changed` |
| `commands/chat.rs` | Streams from LM Studio `/v1/chat/completions`; emits `chat:chunk`, `chat:done`, `chat:error` |
| `commands/dialog.rs` | Native folder picker, Save As dialog, confirm-discard prompt |
| `commands/window.rs` | Title updates, focus mode, window controls (no native chrome) |
| `commands/context_menu.rs` | Right-click: Rename, Delete to Recycle Bin, Show in Explorer |
| `sandbox.rs` | `Sandbox` struct — every file op is validated against the user-selected root path |
| `state.rs` | `AppState`: Sandbox + Watchers HashMap + async task handles for chat/transform |
| `models.rs` | Serde-serializable IPC structs (`FileEntry`, `ReadFileResult`, `FileChangedPayload`, …) |

All file operations are sandboxed: `sandbox.rs` maintains a set of blessed paths; calling any command outside them returns `AccessDenied`.

### React Frontend (`src/renderer/src/`)

State is managed exclusively with **Zustand**. The five stores are:

- **`editorStore`** — active file path, content, dirty flag, selected text/size
- **`fileSystemStore`** — root path, file tree, watch-event application
- **`uiStore`** — all visibility toggles, split ratios, theme, font settings (all persisted to `localStorage`)
- **`chatStore`** — message list, streaming state, LM Studio URL/model/system prompt
- **`transformStore`** — transform panel open/streaming state, original text, streaming result

### Core Data Flows

**File open**: `openFolderDialog()` → Rust sandboxes path → `readDirectory()` → React tree in sidebar → `watchFolder()` spawns Rust watcher → `fs:changed` events → `useWatcher` hook refreshes tree.

**Edit + save**: CodeMirror editor → `editorStore.updateContent()` → `PreviewPane` re-renders via `useMarkdownProcessor` (debounced 150 ms remark/rehype pipeline) → Ctrl+S → `writeFile()` Rust command.

**AI chat**: User sends message → `chatStore.sendMessage()` → Rust `chat_send` command → Rust streams SSE from LM Studio → `chat:chunk` events → Zustand appends to last message incrementally.

**AI transform**: Selected text + instruction → `transformStore.run()` → same streaming pattern → Accept replaces CodeMirror selection via `CustomEvent('transform:accept')`.

### Markdown Rendering

`useMarkdownProcessor` creates a unified pipeline once (remark-parse → remark-gfm → remark-rehype → rehype-sanitize → rehype-react). Custom React components replace `<pre>` (Shiki syntax highlighting, lazy-loaded), `<h1–h6>` (anchor links for document outline), and `<img>` (error handling).

### Layout

`AppShell` is a single flexbox grid: TitleBar (custom chrome, `decorations: false`) + Sidebar + split editor/preview pane + ChatPanel + TransformPanel + StatusBar. Panel resizing uses `setPointerCapture` drag tracking in `AppShell`.

## Key Conventions

- **No native window decorations** — window controls are React components in `TitleBar.tsx`.
- **Markdown-only** — the file tree filters to `.md` files; the save dialog adds the `.md` extension filter.
- **Streaming abort** — chat and transform tasks are tracked by handle in `AppState`; calling `chat_abort` / `transform_abort` drops the handle and cancels the Tauri task.
- **Path aliases** — `@renderer` → `src/renderer/src`, `@shared` → `src/shared` (configured in both `vite.config.ts` and `tsconfig.json`).

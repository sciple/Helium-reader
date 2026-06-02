# Changelog

All notable changes to Helium Reader are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

---

## [1.0.0] - 2026-06-02

### Added

- **Pinned document context** — pin any file in the sidebar to keep it in the LLM's context regardless of which document is open. Pinned files appear as removable badges in the chat input area and persist per folder across sessions.
- **Reading time estimate** — status bar now shows an estimated reading time alongside word and character counts (200 wpm).
- **Document outline** — collapsible heading tree (H1–H6) in the sidebar; clicking a heading scrolls both the editor and preview to that section.
- **Full-document context toggle** — 📄 button in the chat header attaches the entire open document as a system message; button highlights in accent colour when active.
- **AI text transform panel** — select text and press `Ctrl+Shift+T` to rewrite it with a preset instruction (Improve style, Make concise, Expand, Fix grammar, Formal/Casual tone) or a custom prompt. Result streams in; Accept replaces the selection.
- **Keyboard shortcuts overlay** — press `?` or click the title-bar button to view all shortcuts.
- **Keyboard navigation** — `Ctrl+Shift+L` opens chat and focuses the input; `Esc` returns focus to the editor.
- **Context window token bar** — token usage progress bar in the chat panel showing prompt + completion tokens against the configured context window size.
- **LM Studio chat** — streaming AI chat via `reqwest` SSE against a local LM Studio endpoint (`/v1/chat/completions`). Supports custom URL, model, system prompt, and context window setting. Selected text is automatically quoted as context.
- **Custom application icon**.
- Initial Tauri 2 + Rust + React 19 + CodeMirror 6 markdown editor with live preview, file tree, file watcher, native menus, and custom window chrome.

### Fixed

- Transform panel: auto-focus input on open; LLM preamble text suppressed from streamed output.
- Document attachment icon now uses an SVG (instead of emoji) so it correctly highlights in accent colour when active.

# Changelog

All notable changes to Helium Reader are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- **Export to PDF** — `Ctrl+P` (or File → Export to PDF) opens a dialog with a live page preview and controls for the exported document's typography (body and heading font, base size in points, line height) and colours (page background, body text, links, headings, plus a light or dark code-block theme). Export hands a fully styled document to the Windows print dialog, where you choose **Save as PDF** / **Microsoft Print to PDF**. Math, text and code stay vector and selectable rather than being rasterised, and KaTeX equations render exactly as they do in the preview. Settings are remembered across sessions; paper size and margins are chosen in the print dialog itself.
- **Math notation** — write LaTeX inline with `$E = mc^2$` (or `$$E = mc^2$$`) and centered display equations with `$$` on their own lines; a ` ```math ` fenced block works too. Rendered in the preview by KaTeX, whose fonts are bundled with the app, so it works fully offline. A malformed expression shows its raw source in red with the parse error as a tooltip instead of breaking the preview. Literal dollar amounts in a sentence need escaping as `\$`.
- **Drag-and-drop and paste images** — drop an image file onto the editor, or paste one straight from the Snipping Tool (`Win+Shift+S` → `Ctrl+V`). The file is copied into a `media/` folder at the root of the open folder (created on first use) and markdown image syntax is inserted at the drop point or cursor. Dropped files keep their original name, deduplicated with `-1`, `-2`, …; pasted screenshots are named `pasted-YYYYMMDD-HHMMSS.png`.
- **Slash commands** — type `/` at the start of a line in the editor to open a command palette. Available commands: `/table` (3×3), `/table-2col`, `/table-4col`, `/code` (fenced block), `/callout` (blockquote), `/toc` (table of contents from headings), `/date` (today's date), `/hr` (horizontal rule), `/math` (centered equation block), `/imath` (inline math).
- **Spell-check toggle** — a switch in the status bar turns the editor's red spell-check underlines on or off, so you can write in languages the English dictionary doesn't cover (e.g. Italian) without every word being flagged. The setting is remembered across sessions.

### Fixed
- **Transform panel follows the selection** — the panel used to keep transforming the text that was selected when it opened (`Ctrl+Shift+T`), so changing another sentence meant closing and reopening it. Selecting new text while the panel is open now makes it the text to transform, and drops any result or stream for the old selection so Accept can no longer overwrite the new selection with a rewrite of the old one.
- **Chat with pinned files on strict models** — attaching document context (the open file or pinned files) together with a system prompt sent several `system` messages, which models with strict chat templates such as Gemma 3 reject ("Conversation roles must alternate user/assistant"). The system prompt and all document context are now sent as one system message.
- **Syntax highlighting in installed builds** — code blocks rendered without colour in the packaged app (though correctly in development), because the app's content security policy blocked the WebAssembly grammar engine the highlighter compiles. The failure was silent, so it went unnoticed since 1.0.0. Highlighting now works in installed builds, and a highlighter that fails to start is reported instead of being swallowed.
- PDF export no longer depends on syntax highlighting: if the highlighter is unavailable, code blocks export as plain text rather than the whole export failing.
- Relative image paths in the preview now resolve against the open document's own folder instead of the folder root, so images referenced from a note in a subfolder render correctly.

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

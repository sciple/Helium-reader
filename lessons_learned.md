# Lessons learned

The record of what did not work in this project. Newest entry first.

### 2026-10-21 — "Esc to stop" planned into the chat waiting line, but Esc doesn't stop a chat request

**What we tried.** The plan for the chat/transform waiting line (pattern #6, "Show liveness") had it end with "Esc to stop" in both panels.
**Why it seemed right.** The README says "`Esc` aborts a stream", and `ChatInput.tsx` has an Escape branch that calls `onAbort()` while streaming.
**How it failed.** Reading the code during the work showed the chat textarea gets `disabled={isStreaming}`. A disabled textarea doesn't receive key events, so that Escape branch never runs during a stream, and nothing else in the chat listens for Esc. In the transform panel Esc works, because it has its own window-level listener.
**What replaced it.** The waiting line takes its stop hint per panel: "■ to stop" in chat, "Esc to stop" in transform. Esc in chat is still broken, and the README line is still wrong; both are left for a separate fix.
**Lesson.** Before putting a keyboard hint in the UI, check the handler can actually receive the key in that state (focus, `disabled`), not just that it exists in the code or the docs.

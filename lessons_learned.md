# Lessons learned

The record of what did not work in this project. Newest entry first.

### 2026-10-21 — New app icon shipped as the document variant, then replaced by the navy tile

**What we tried.** Two icon drafts were made in the style of the user's other app icons. Variant B (white document, HE mark, two text lines, blue chat bubble) was chosen, built into every file in `src-tauri/icons/`, compiled into a release build, and the Windows icon cache was refreshed.
**Why it seemed right.** B was the only one that showed what the app does: a markdown document plus AI chat.
**How it failed.** The user changed their mind and went with variant A (HE on a navy tile) before anything was committed. The drafts page had already said B's text lines and bubble dots blur at 16 px, and A stays readable there. The full process (regenerating the icons, release build, cache refresh) had to be done twice.
**What replaced it.** Variant A, in `resources/Helium_icon_v2.svg`. Not yet committed.
**Lesson.** Choose an app icon by how it looks at 16–32 px in the taskbar, not at full size, and confirm the choice before running the slow build steps.

### 2026-10-21 — "Esc to stop" planned into the chat waiting line, but Esc doesn't stop a chat request

**What we tried.** The plan for the chat/transform waiting line (pattern #6, "Show liveness") had it end with "Esc to stop" in both panels.
**Why it seemed right.** The README says "`Esc` aborts a stream", and `ChatInput.tsx` has an Escape branch that calls `onAbort()` while streaming.
**How it failed.** Reading the code during the work showed the chat textarea gets `disabled={isStreaming}`. A disabled textarea doesn't receive key events, so that Escape branch never runs during a stream, and nothing else in the chat listens for Esc. In the transform panel Esc works, because it has its own window-level listener.
**What replaced it.** The waiting line takes its stop hint per panel: "■ to stop" in chat, "Esc to stop" in transform. Esc in chat is still broken, and the README line is still wrong; both are left for a separate fix.
**Lesson.** Before putting a keyboard hint in the UI, check the handler can actually receive the key in that state (focus, `disabled`), not just that it exists in the code or the docs.

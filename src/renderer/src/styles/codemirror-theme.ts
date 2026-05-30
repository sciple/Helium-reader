import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

// ── Dark theme ────────────────────────────────────────────────────────────────

export const ghostThemeDark = EditorView.theme(
  {
    '&': {
      color: '#e0e0e0',
      backgroundColor: '#1a1a1a',
      height: '100%',
      fontSize: 'var(--editor-font-size, 15px)',
      fontFamily: 'var(--font-mono)'
    },
    '.cm-content': { caretColor: '#38bdf8', padding: '24px 0', maxWidth: 'var(--editor-prose-width, 720px)', margin: '0 auto' },
    '.cm-focused .cm-cursor': { borderLeftColor: '#38bdf8' },
    '.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(56, 189, 248, 0.25)'
    },
    '.cm-panels': { backgroundColor: '#141414', color: '#e0e0e0' },
    '.cm-gutters': { backgroundColor: '#1a1a1a', color: '#555555', border: 'none' },
    '.cm-activeLineGutter': { backgroundColor: '#202020' },
    '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
    '.cm-matchingBracket': { color: '#38bdf8', fontWeight: 'bold' },
    '.cm-scroller': { overflow: 'auto', lineHeight: '1.75' },
    '.cm-spell-error': { textDecoration: 'underline wavy #e57373' }
  },
  { dark: true }
)

export const ghostHighlightDark = syntaxHighlighting(
  HighlightStyle.define([
    { tag: t.heading1, color: '#e0e0e0', fontWeight: 'bold', fontSize: '1.5em' },
    { tag: t.heading2, color: '#e0e0e0', fontWeight: 'bold', fontSize: '1.3em' },
    { tag: t.heading3, color: '#e0e0e0', fontWeight: 'bold', fontSize: '1.1em' },
    { tag: [t.heading4, t.heading5, t.heading6], color: '#e0e0e0', fontWeight: 'bold' },
    { tag: t.emphasis, color: '#c792ea', fontStyle: 'italic' },
    { tag: t.strong, color: '#ffcb6b', fontWeight: 'bold' },
    { tag: t.strikethrough, color: '#888888', textDecoration: 'line-through' },
    { tag: t.link, color: '#38bdf8', textDecoration: 'underline' },
    { tag: t.url, color: '#38bdf8' },
    { tag: t.monospace, color: '#c3e88d', fontFamily: 'var(--font-mono)' },
    { tag: t.comment, color: '#555555', fontStyle: 'italic' },
    { tag: t.processingInstruction, color: '#555555' },
    { tag: t.contentSeparator, color: '#444444' },
    { tag: t.list, color: '#82aaff' },
    { tag: t.quote, color: '#888888', fontStyle: 'italic' },
    { tag: t.meta, color: '#555555' }
  ])
)

// ── Light theme ───────────────────────────────────────────────────────────────

export const ghostThemeLight = EditorView.theme(
  {
    '&': {
      color: '#1a1a1a',
      backgroundColor: '#f9f9f7',
      height: '100%',
      fontSize: 'var(--editor-font-size, 15px)',
      fontFamily: 'var(--font-mono)'
    },
    '.cm-content': { caretColor: '#0ea5e9', padding: '24px 0', maxWidth: 'var(--editor-prose-width, 720px)', margin: '0 auto' },
    '.cm-focused .cm-cursor': { borderLeftColor: '#0ea5e9' },
    '.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(14, 165, 233, 0.18)'
    },
    '.cm-panels': { backgroundColor: '#ededeb', color: '#1a1a1a' },
    '.cm-gutters': { backgroundColor: '#f9f9f7', color: '#aaaaaa', border: 'none' },
    '.cm-activeLineGutter': { backgroundColor: '#f0f0ee' },
    '.cm-activeLine': { backgroundColor: 'rgba(0,0,0,0.03)' },
    '.cm-matchingBracket': { color: '#0ea5e9', fontWeight: 'bold' },
    '.cm-scroller': { overflow: 'auto', lineHeight: '1.75' },
    '.cm-spell-error': { textDecoration: 'underline wavy #c0392b' }
  },
  { dark: false }
)

export const ghostHighlightLight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: t.heading1, color: '#1a1a1a', fontWeight: 'bold', fontSize: '1.5em' },
    { tag: t.heading2, color: '#1a1a1a', fontWeight: 'bold', fontSize: '1.3em' },
    { tag: t.heading3, color: '#1a1a1a', fontWeight: 'bold', fontSize: '1.1em' },
    { tag: [t.heading4, t.heading5, t.heading6], color: '#1a1a1a', fontWeight: 'bold' },
    { tag: t.emphasis, color: '#7c3aed', fontStyle: 'italic' },
    { tag: t.strong, color: '#b45309', fontWeight: 'bold' },
    { tag: t.strikethrough, color: '#aaaaaa', textDecoration: 'line-through' },
    { tag: t.link, color: '#0ea5e9', textDecoration: 'underline' },
    { tag: t.url, color: '#0ea5e9' },
    { tag: t.monospace, color: '#2d6a4f', fontFamily: 'var(--font-mono)' },
    { tag: t.comment, color: '#aaaaaa', fontStyle: 'italic' },
    { tag: t.processingInstruction, color: '#aaaaaa' },
    { tag: t.contentSeparator, color: '#cccccc' },
    { tag: t.list, color: '#2563eb' },
    { tag: t.quote, color: '#666666', fontStyle: 'italic' },
    { tag: t.meta, color: '#aaaaaa' }
  ])
)

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getThemeExtensions(isDark: boolean) {
  return isDark
    ? [ghostThemeDark, ghostHighlightDark]
    : [ghostThemeLight, ghostHighlightLight]
}

// Keep old exports so existing imports don't break
export const ghostTheme = ghostThemeDark
export const ghostHighlightStyle = ghostHighlightDark

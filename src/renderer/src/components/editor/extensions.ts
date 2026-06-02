import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands'
import { EditorView, drawSelection, highlightActiveLine, keymap } from '@codemirror/view'
import { Compartment } from '@codemirror/state'
import { getThemeExtensions } from '../../styles/codemirror-theme'
import { spellCheckLinter } from './spellcheck'
import { slashCommandExtension } from './slashCommands'

export const themeCompartment = new Compartment()

export function buildExtensions(
  onChange: (value: string) => void,
  onSelectionChange: (size: number, text: string) => void,
  isDark = true
) {
  return [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    themeCompartment.of(getThemeExtensions(isDark)),
    history(),
    drawSelection(),
    highlightActiveLine(),
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    spellCheckLinter(),
    slashCommandExtension(),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
      if (update.selectionSet || update.docChanged) {
        const sel = update.state.selection.main
        const text = update.state.doc.sliceString(sel.from, sel.to)
        onSelectionChange(sel.to - sel.from, text)
      }
    })
  ]
}

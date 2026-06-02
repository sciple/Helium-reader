import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import { EditorView } from '@codemirror/view'

interface SlashCommand {
  label: string
  detail: string
  apply: (view: EditorView, from: number, to: number) => void
}

function makeTable(cols: number, rows: number): string {
  const header = '| ' + Array.from({ length: cols }, (_, i) => `Header ${i + 1}`).join(' | ') + ' |'
  const divider = '| ' + Array(cols).fill('--------').join(' | ') + ' |'
  const row = '| ' + Array(cols).fill('        ').join(' | ') + ' |'
  return [header, divider, ...Array(rows).fill(row)].join('\n')
}

function makeToc(doc: string): string {
  const lines = doc.split('\n')
  const entries: string[] = []
  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.+)/)
    if (!m) continue
    const level = m[1].length
    const title = m[2].trim()
    const anchor = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    entries.push(`${'  '.repeat(level - 1)}- [${title}](#${anchor})`)
  }
  return entries.length > 0 ? entries.join('\n') : '<!-- no headings found -->'
}

const COMMANDS: SlashCommand[] = [
  {
    label: '/table',
    detail: '3×3 markdown table',
    apply: (view, from, to) => {
      const text = makeTable(3, 3)
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + 2 }
      })
    }
  },
  {
    label: '/table-2col',
    detail: '2-column table',
    apply: (view, from, to) => {
      const text = makeTable(2, 3)
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + 2 }
      })
    }
  },
  {
    label: '/table-4col',
    detail: '4-column table',
    apply: (view, from, to) => {
      const text = makeTable(4, 3)
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + 2 }
      })
    }
  },
  {
    label: '/code',
    detail: 'Fenced code block',
    apply: (view, from, to) => {
      const text = '```\n\n```'
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + 3 }
      })
    }
  },
  {
    label: '/callout',
    detail: 'Blockquote callout',
    apply: (view, from, to) => {
      const text = '> **Note:** '
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length }
      })
    }
  },
  {
    label: '/toc',
    detail: 'Table of contents from headings',
    apply: (view, from, to) => {
      const text = makeToc(view.state.doc.toString())
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from }
      })
    }
  },
  {
    label: '/date',
    detail: 'Today\'s date (YYYY-MM-DD)',
    apply: (view, from, to) => {
      const text = new Date().toISOString().slice(0, 10)
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length }
      })
    }
  },
  {
    label: '/hr',
    detail: 'Horizontal rule',
    apply: (view, from, to) => {
      const text = '---'
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length }
      })
    }
  }
]

function slashSource(context: CompletionContext): CompletionResult | null {
  const match = context.matchBefore(/\/\w*/)
  if (!match) return null

  // Only trigger at start of line (ignoring leading whitespace) to avoid /path/to/file
  const line = context.state.doc.lineAt(match.from)
  const textBefore = context.state.doc.sliceString(line.from, match.from)
  if (textBefore.trim() !== '') return null

  return {
    from: match.from,
    filter: true,
    options: COMMANDS.map((cmd) => ({
      label: cmd.label,
      detail: cmd.detail,
      apply: (view: EditorView, _completion: unknown, from: number, to: number) => {
        cmd.apply(view, from, to)
        view.focus()
      }
    }))
  }
}

export function slashCommandExtension() {
  return autocompletion({
    override: [slashSource],
    activateOnTyping: true,
    closeOnBlur: true,
    icons: false
  })
}

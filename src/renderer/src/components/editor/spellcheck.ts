import { linter, type Diagnostic } from '@codemirror/lint'
import { syntaxTree } from '@codemirror/language'

// Loaded lazily on first use — ~1.4 MB word list
let wordSet: Set<string> | null = null

async function getWordSet(): Promise<Set<string>> {
  if (wordSet) return wordSet
  const { default: words } = await import('an-array-of-english-words')
  wordSet = new Set(words as string[])
  return wordSet
}

// Markdown node types whose content should not be spell-checked
const SKIP_NODES = new Set([
  'FencedCode', 'CodeBlock', 'InlineCode',
  'HTMLBlock', 'HTMLInline', 'Link', 'URL', 'Image'
])

const WORD_RE = /\b[a-zA-Z]{3,}\b/g

export function spellCheckLinter() {
  return linter(
    async (view) => {
      const dict = await getWordSet()
      const diagnostics: Diagnostic[] = []
      const text = view.state.doc.toString()
      const tree = syntaxTree(view.state)

      // Collect ranges to skip
      const skipRanges: { from: number; to: number }[] = []
      tree.iterate({
        enter(node) {
          if (SKIP_NODES.has(node.name)) {
            skipRanges.push({ from: node.from, to: node.to })
            return false
          }
        }
      })

      WORD_RE.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = WORD_RE.exec(text)) !== null) {
        const from = match.index
        const to = from + match[0].length

        // Skip words starting with uppercase (proper nouns, sentence starts)
        if (match[0].charCodeAt(0) < 97) continue

        // Skip ranges inside code/link nodes
        if (skipRanges.some((r) => from >= r.from && to <= r.to)) continue

        if (!dict.has(match[0])) {
          diagnostics.push({
            from,
            to,
            severity: 'warning',
            message: `Unknown word: "${match[0]}"`,
            markClass: 'cm-spell-error'
          })
        }
      }

      return diagnostics
    },
    { delay: 600 }
  )
}

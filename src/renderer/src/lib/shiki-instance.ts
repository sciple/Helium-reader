import { createHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      // github-light exists for the PDF export's light code theme. Each theme is a
      // lazily-imported ~10 KB chunk, and CodeBlock still names github-dark
      // explicitly, so the on-screen preview is unaffected.
      themes: ['github-dark', 'github-light'],
      langs: [
        'javascript', 'typescript', 'jsx', 'tsx',
        'python', 'rust', 'go', 'java', 'c', 'cpp',
        'css', 'html', 'json', 'yaml', 'toml', 'bash',
        'markdown', 'sql', 'dockerfile', 'r', 'matlab'
      ]
    })
  }
  return highlighterPromise
}

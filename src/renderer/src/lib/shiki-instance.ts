import { createHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      // The preview picks one of these to match the app's light/dark theme; the
      // PDF export lets the user choose either. Each is a lazily-imported ~10 KB chunk.
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

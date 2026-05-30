import { createHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
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

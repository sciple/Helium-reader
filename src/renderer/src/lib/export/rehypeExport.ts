import type { Root, Element, ElementContent, Parent, RootContent } from 'hast'
import type { Highlighter } from 'shiki'
import { slugify } from '../slugify'
import { resolveAssetSrc } from '../mediaImages'

/**
 * Depth-first element walk. Hand-rolled rather than pulling in unist-util-visit,
 * which is only a transitive dependency here. Returning true from `fn` skips the
 * subtree — needed when a node has just been replaced.
 */
function walk(node: Parent, fn: (el: Element, parent: Parent, index: number) => boolean | void): void {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (child.type !== 'element') continue
    const skip = fn(child, node, i)
    // Re-read: fn may have replaced children[i] with a different node.
    const current = node.children[i]
    if (skip !== true && current.type === 'element') walk(current, fn)
  }
}

function classList(el: Element): string[] {
  const c = el.properties?.className
  if (Array.isArray(c)) return c.map(String)
  if (typeof c === 'string') return c.split(/\s+/)
  return []
}

function textOf(node: ElementContent | RootContent | Root): string {
  if (node.type === 'text') return node.value
  if ('children' in node) return node.children.map(textOf).join('')
  return ''
}

/** Fence infostrings people actually type, mapped onto the langs shiki-instance loads. */
const LANG_ALIASES: Record<string, string> = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', node: 'javascript',
  ts: 'typescript', mts: 'typescript',
  py: 'python', rs: 'rust', golang: 'go',
  sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', ps1: 'bash',
  yml: 'yaml', 'c++': 'cpp', h: 'c', hpp: 'cpp',
  docker: 'dockerfile', md: 'markdown',
  txt: 'text', plain: 'text', plaintext: 'text'
}

/**
 * Replace fenced code blocks with Shiki-highlighted markup.
 *
 * Uses `codeToHast` rather than `codeToHtml` so the result splices straight into
 * the tree as real nodes — no raw HTML, so `rehype-stringify` needs no
 * `allowDangerousHtml`. The highlighter must already be resolved: this pass is
 * synchronous, as rehype plugins are.
 */
export function rehypeShiki(options: { highlighter: Highlighter; theme: string }) {
  const { highlighter, theme } = options
  const loaded = new Set(highlighter.getLoadedLanguages())

  return function (tree: Root): undefined {
    walk(tree, (el, parent, index) => {
      if (el.tagName !== 'pre') return
      const code = el.children.find(
        (c): c is Element => c.type === 'element' && c.tagName === 'code'
      )
      if (!code) return

      const classes = classList(code)
      // Defence in depth: rehype-katex has already replaced ```math fences by the
      // time this runs, but never hand a math node to the tokenizer if that changes.
      if (classes.some((c) => c === 'language-math' || c.startsWith('math-'))) return true

      const requested = classes.find((c) => c.startsWith('language-'))?.slice(9).toLowerCase()
      // A bare fence, and any language shiki-instance did not load, both fall back to
      // 'text' — a shiki special language that is always available.
      const wanted = requested ? (LANG_ALIASES[requested] ?? requested) : 'text'
      const lang = loaded.has(wanted) ? wanted : 'text'

      let hast: Root
      try {
        hast = highlighter.codeToHast(textOf(code).replace(/\n+$/, ''), { lang, theme })
      } catch {
        // Leave the original <pre> in place; the export stylesheet still styles it.
        return true
      }

      const pre = hast.children.find((c): c is Element => c.type === 'element')
      if (!pre) return true

      pre.properties = { ...pre.properties, className: [...classList(pre), 'pdf-code'] }
      parent.children[index] = pre
      return true
    })
  }
}

/**
 * Give every heading an id so in-document links resolve in the exported PDF.
 * Runs after sanitize, which would otherwise strip the id.
 */
export function rehypeHeadingIds() {
  return function (tree: Root): undefined {
    const seen = new Map<string, number>()
    walk(tree, (el) => {
      if (!/^h[1-6]$/.test(el.tagName)) return
      const base = slugify(textOf(el)) || 'section'
      const n = seen.get(base) ?? 0
      seen.set(base, n + 1)
      el.properties = { ...el.properties, id: n === 0 ? base : `${base}-${n}` }
    })
  }
}

/** Rewrite relative image sources to asset-protocol URLs the webview can load. */
export function rehypeExportImages(options: { baseDir: string | null }) {
  return function (tree: Root): undefined {
    walk(tree, (el) => {
      if (el.tagName !== 'img') return
      const src = el.properties?.src
      if (typeof src === 'string') {
        el.properties = { ...el.properties, src: resolveAssetSrc(src, options.baseDir) }
      }
    })
  }
}

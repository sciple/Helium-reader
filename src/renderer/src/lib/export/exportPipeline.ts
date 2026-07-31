import rehypeStringify from 'rehype-stringify'
import { createBaseProcessor } from '../markdown/pipeline-base'
import { getHighlighter } from '../shiki-instance'
import { rehypeShiki, rehypeHeadingIds, rehypeExportImages } from './rehypeExport'
import type { CodeTheme } from '../../store/exportStore'

export interface FragmentOptions {
  codeTheme: CodeTheme
  /** Folder relative image paths resolve against — see `currentBaseDir()`. */
  baseDir: string | null
}

/**
 * Markdown → an HTML *fragment* (no <html>/<head>), sharing all markdown semantics
 * with the live preview via `createBaseProcessor()`.
 *
 * The processor is built per call rather than memoised: the Shiki pass needs the
 * theme and a resolved highlighter frozen as plugin options, and the image pass
 * needs the current baseDir. Construction is just plugin registration — the
 * expensive singletons (the highlighter, KaTeX) stay memoised.
 */
export async function markdownToHtmlFragment(
  markdown: string,
  opts: FragmentOptions
): Promise<string> {
  // Must resolve before the processor runs: rehype plugins are synchronous.
  const highlighter = await getHighlighter()

  const processor = createBaseProcessor()
    .use(rehypeHeadingIds)
    .use(rehypeShiki, { highlighter, theme: opts.codeTheme })
    .use(rehypeExportImages, { baseDir: opts.baseDir })
    .use(rehypeStringify)

  return String(await processor.process(markdown))
}

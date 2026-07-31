import katexCss from 'katex/dist/katex.min.css?inline'
import { buildExportStylesheet, STYLE_ELEMENT_ID } from './exportStylesheet'
import type { ExportSettings } from '../../store/exportStore'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Assemble the standalone document that gets printed.
 *
 * KaTeX's stylesheet is inlined via Vite's `?inline`, which yields the same string
 * in dev and in a production build with its `url()` font references already
 * rewritten to resolvable URLs. Cloning the app's own <style>/<link> nodes instead
 * would drag the editor's theme into the export and defeat the point.
 *
 * The document contains no scripts — the app's CSP is `script-src 'self'`, which an
 * inline one would violate. Everything that needs waiting on is driven from the
 * parent through `iframe.contentDocument`.
 */
export function buildExportDocument(
  fragment: string,
  settings: ExportSettings,
  title: string
): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<base href="${escapeHtml(document.baseURI)}">
<title>${escapeHtml(title)}</title>
<style>${katexCss}</style>
<style id="${STYLE_ELEMENT_ID}">${buildExportStylesheet(settings)}</style>
</head>
<body>${fragment}</body>
</html>`
}

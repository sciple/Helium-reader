import { FONT_STACKS, type ExportSettings } from '../../store/exportStore'

/** Id of the generated <style> element, so colour changes can patch it in place. */
export const STYLE_ELEMENT_ID = 'pdf-style'

/** Page margin baked into the export. The print dialog can still override it. */
export const PAGE_MARGIN = '18mm'

const MONO_STACK = "Consolas, 'Cascadia Mono', 'Courier New', monospace"

/**
 * Linear blend of two #rrggbb values; t = 0 → a, t = 1 → b. Derived colours are
 * computed here rather than with CSS color-mix() — the inputs always come from a
 * colour input, so they are always well-formed hex.
 */
function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) || 0)
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const ch = (x: number, y: number) =>
    Math.round(x + (y - x) * t).toString(16).padStart(2, '0')
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`
}

export function buildExportStylesheet(s: ExportSettings): string {
  const body = FONT_STACKS[s.bodyFont].stack
  const heading = s.headingFont === 'match' ? body : FONT_STACKS[s.headingFont].stack
  const rule = mixHex(s.pageBg, s.textColor, 0.22)     // borders, hairlines
  const surface = mixHex(s.pageBg, s.textColor, 0.07)  // table headers, inline code
  const muted = mixHex(s.pageBg, s.textColor, 0.72)    // blockquotes, captions

  return `
@page { margin: ${PAGE_MARGIN}; }

:root {
  --pdf-bg: ${s.pageBg};
  --pdf-text: ${s.textColor};
  --pdf-link: ${s.linkColor};
  --pdf-heading: ${s.headingColor};
  --pdf-rule: ${rule};
  --pdf-surface: ${surface};
  --pdf-muted: ${muted};
  --pdf-body-font: ${body};
  --pdf-heading-font: ${heading};
  --pdf-mono: ${MONO_STACK};
}

*, *::before, *::after { box-sizing: border-box; }

html {
  background: var(--pdf-bg);
  /* Inherited, so this one declaration also covers code blocks and table headers.
     Forces backgrounds through even when the print dialog's "Background graphics"
     checkbox is unticked. */
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  margin: 0;
  background: var(--pdf-bg);
  color: var(--pdf-text);
  font-family: var(--pdf-body-font);
  /* pt, not px: the printed page is measured in physical units. */
  font-size: ${s.fontSizePt}pt;
  line-height: ${s.lineHeight};
  text-rendering: optimizeLegibility;
}

/* The @page margin does not exist on screen — fake it so the dialog preview
   shows the same text block the print will. */
@media screen { body { padding: ${PAGE_MARGIN}; } }

p { margin: 0 0 0.75em; orphans: 3; widows: 3; }

h1, h2, h3, h4, h5, h6 {
  font-family: var(--pdf-heading-font);
  color: var(--pdf-heading);
  line-height: 1.25;
  margin: 1.4em 0 0.5em;
  /* A heading stranded at the foot of a page is the worst print artefact there is. */
  break-after: avoid-page;
  page-break-after: avoid;
  break-inside: avoid;
}
h1:first-child, h2:first-child, h3:first-child { margin-top: 0; }
h1 { font-size: 1.9em; border-bottom: 1px solid var(--pdf-rule); padding-bottom: 0.25em; }
h2 { font-size: 1.5em; border-bottom: 1px solid var(--pdf-rule); padding-bottom: 0.2em; }
h3 { font-size: 1.25em; }
h4 { font-size: 1.1em; }
h5, h6 { font-size: 1em; letter-spacing: 0.02em; }

a { color: var(--pdf-link); text-decoration: underline; }

ul, ol { margin: 0 0 0.75em; padding-left: 1.6em; }
li { margin: 0.2em 0; }
li > ul, li > ol { margin-bottom: 0; }
li::marker { color: var(--pdf-muted); }
input[type="checkbox"] { margin-right: 0.4em; }

blockquote {
  margin: 1em 0;
  padding: 0.4em 1em;
  border-left: 3px solid var(--pdf-link);
  color: var(--pdf-muted);
  break-inside: avoid;
}

hr { border: 0; border-top: 1px solid var(--pdf-rule); margin: 1.8em 0; }

code { font-family: var(--pdf-mono); font-size: 0.88em; }
:not(pre) > code {
  background: var(--pdf-surface);
  border: 1px solid var(--pdf-rule);
  border-radius: 3px;
  padding: 0.05em 0.35em;
}
pre {
  margin: 1em 0;
  padding: 0.8em 1em;
  border: 1px solid var(--pdf-rule);
  border-radius: 5px;
  font-size: 0.85em;
  line-height: 1.45;
  /* Shiki never wraps, and paper has no horizontal scrollbar to escape into. */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  break-inside: avoid;
}
/* …but a listing taller than a page must be allowed to split rather than vanish. */
pre.pdf-code { break-inside: auto; }
pre code { font-size: inherit; background: none; border: 0; padding: 0; }

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.92em;
  break-inside: auto;
}
thead { display: table-header-group; }   /* repeat the header on every page */
tfoot { display: table-footer-group; }
tr { break-inside: avoid; }
th, td {
  border: 1px solid var(--pdf-rule);
  padding: 0.4em 0.6em;
  text-align: left;
  vertical-align: top;
}
th { background: var(--pdf-surface); font-weight: 600; }

img { max-width: 100%; height: auto; break-inside: avoid; }
figure { margin: 1em 0; break-inside: avoid; }
figcaption {
  font-size: 0.85em;
  color: var(--pdf-muted);
  text-align: center;
  margin-top: 0.4em;
}

.katex { font-size: 1.05em; }
.katex-display {
  margin: 1.1em 0;
  break-inside: avoid;
  /* fitDisplayMath() scales wide equations down before printing; this is the
     backstop for the ones too wide even for that. */
  overflow: hidden;
}
.katex-display > .katex { display: block; max-width: 100%; text-align: center; }
.katex-error { font-family: var(--pdf-mono); font-size: 0.9em; }

.footnotes {
  font-size: 0.85em;
  margin-top: 2.5em;
  padding-top: 0.6em;
  border-top: 1px solid var(--pdf-rule);
}
.footnotes h2 { font-size: 1em; border: 0; }
`
}

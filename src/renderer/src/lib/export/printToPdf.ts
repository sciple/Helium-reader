/** How long to wait for images and web fonts before printing anyway. */
const SETTLE_TIMEOUT_MS = 5_000

/** Long-stop for removing the print frame if `afterprint` never arrives. */
const CLEANUP_FALLBACK_MS = 120_000

/** Below this, shrinking display math does more harm than clipping it. */
const MIN_MATH_SCALE = 0.55

/**
 * Replace an iframe's document with `html` and wait for it to settle.
 *
 * `document.open()` called from the parent also sets the child document's URL to
 * the parent's, so root-absolute /assets/… references inside `html` resolve.
 */
export async function writeDocument(iframe: HTMLIFrameElement, html: string): Promise<void> {
  const doc = iframe.contentDocument
  if (!doc) return

  doc.open()
  doc.write(html)
  doc.close()

  await settle(doc)
}

async function settle(doc: Document): Promise<void> {
  // Force layout first. `doc.fonts.ready` is a promise over the *currently pending*
  // font loads, and KaTeX's fonts are not pending until some .katex text has been
  // laid out with them — without this it resolves immediately and we print with
  // fallback glyphs.
  void doc.body.offsetHeight
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )

  const images = Array.from(doc.images).map((img) =>
    img.complete && img.naturalWidth > 0
      ? Promise.resolve()
      // decode() rejects on a broken src and can hang on one that never starts;
      // the outer race is the backstop for both.
      : img.decode().catch(() => undefined)
  )

  await Promise.race([
    Promise.all([doc.fonts.ready, ...images]),
    new Promise<void>((resolve) => setTimeout(resolve, SETTLE_TIMEOUT_MS))
  ])
}

/**
 * Shrink display equations that would run past the page edge. KaTeX lays display
 * math out without wrapping, and paper cannot scroll.
 */
function fitDisplayMath(doc: Document): void {
  const blocks = doc.querySelectorAll<HTMLElement>('.katex-display > .katex')
  for (const el of Array.from(blocks)) {
    const available = el.parentElement?.clientWidth ?? 0
    const needed = el.scrollWidth
    if (available > 0 && needed > available + 1) {
      const scale = Math.max(MIN_MATH_SCALE, available / needed)
      el.style.transformOrigin = 'center center'
      el.style.transform = `scale(${scale.toFixed(3)})`
    }
  }
}

/**
 * Render `html` in an off-screen frame and open the system print dialog on it,
 * where the user picks "Save as PDF" / "Microsoft Print to PDF".
 *
 * Printing the frame's own window (rather than the top window) is what makes the
 * export document's `@page` rule apply — a nested frame's page box is ignored when
 * the top document is the print root.
 */
export async function printHtml(html: string): Promise<void> {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.setAttribute('tabindex', '-1')
  // Off-screen, but NOT display:none — Chromium neither lays out nor loads
  // resources for a display:none frame, and an unlaid-out frame prints blank.
  iframe.style.cssText =
    'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;'
  document.body.appendChild(iframe)

  try {
    await writeDocument(iframe, html)

    const doc = iframe.contentDocument
    const win = iframe.contentWindow
    if (!doc || !win) throw new Error('Print frame unavailable')

    fitDisplayMath(doc)

    let removed = false
    const cleanup = () => {
      if (removed) return
      removed = true
      iframe.remove()
    }

    // Deliberately not a `finally { iframe.remove() }`. print() blocks the calling
    // frame in desktop Chromium, but WebView2 hosts the preview out of process and
    // may return immediately — removing the node then would destroy the document
    // out from under an open preview and produce a blank PDF. Removal is driven off
    // afterprint (deferred one task past the print teardown, which still reads the
    // document), with a long-stop timer in case it never fires.
    win.addEventListener('afterprint', () => setTimeout(cleanup, 0), { once: true })
    setTimeout(cleanup, CLEANUP_FALLBACK_MS)

    win.focus()
    win.print()
  } catch (err) {
    iframe.remove()
    throw err
  }
}

import './PreviewPane.css'
import { useMarkdownProcessor } from '../../hooks/useMarkdownProcessor'
import { useEditorStore } from '../../store/editorStore'
import { useUiStore, type PreviewFont } from '../../store/uiStore'

const fontFamilyMap: Record<PreviewFont, string> = {
  serif: "Georgia, 'Cambria', serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "var(--font-mono)"
}

export default function PreviewPane() {
  const content = useEditorStore((s) => s.content)
  const previewFont = useUiStore((s) => s.previewFont)
  const rendered = useMarkdownProcessor(content)

  return (
    <div className="preview-pane">
      <div
        className="preview-content"
        style={{ fontFamily: fontFamilyMap[previewFont] }}
      >
        {rendered}
      </div>
    </div>
  )
}

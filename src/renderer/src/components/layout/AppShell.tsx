import './AppShell.css'
import { useCallback, useRef } from 'react'
import TitleBar from '../chrome/TitleBar'
import StatusBar from '../chrome/StatusBar'
import ShortcutsOverlay from '../chrome/ShortcutsOverlay'
import Sidebar from './Sidebar'
import SplitPane from './SplitPane'
import ChatPanel from '../chat/ChatPanel'
import TransformPanel from '../transform/TransformPanel'
import { useUiStore } from '../../store/uiStore'
import { useTransformStore } from '../../store/transformStore'

export default function AppShell() {
  const sidebarVisible = useUiStore((s) => s.sidebarVisible)
  const focusMode = useUiStore((s) => s.focusMode)
  const chatPanelVisible = useUiStore((s) => s.chatPanelVisible)
  const chatPanelWidth = useUiStore((s) => s.chatPanelWidth)
  const setChatPanelWidth = useUiStore((s) => s.setChatPanelWidth)
  const shortcutsVisible = useUiStore((s) => s.shortcutsVisible)
  const setShortcutsVisible = useUiStore((s) => s.setShortcutsVisible)
  const transformPanelHeight = useUiStore((s) => s.transformPanelHeight)
  const setTransformPanelHeight = useUiStore((s) => s.setTransformPanelHeight)
  const transformOpen = useTransformStore((s) => s.isOpen)

  // ── Chat panel drag ───────────────────────────────────────────────────────
  const chatDragging = useRef(false)
  const chatStartX = useRef(0)
  const chatStartWidth = useRef(0)

  const onChatDividerDown = useCallback((e: React.PointerEvent) => {
    chatDragging.current = true
    chatStartX.current = e.clientX
    chatStartWidth.current = chatPanelWidth
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [chatPanelWidth])

  // ── Transform panel drag ──────────────────────────────────────────────────
  const transformDragging = useRef(false)
  const transformStartY = useRef(0)
  const transformStartHeight = useRef(0)

  const onTransformDividerDown = useCallback((e: React.PointerEvent) => {
    transformDragging.current = true
    transformStartY.current = e.clientY
    transformStartHeight.current = transformPanelHeight
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [transformPanelHeight])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (chatDragging.current) {
      const delta = chatStartX.current - e.clientX
      setChatPanelWidth(chatStartWidth.current + delta)
    }
    if (transformDragging.current) {
      const delta = transformStartY.current - e.clientY
      setTransformPanelHeight(transformStartHeight.current + delta)
    }
  }, [setChatPanelWidth, setTransformPanelHeight])

  const onPointerUp = useCallback(() => {
    chatDragging.current = false
    transformDragging.current = false
  }, [])

  return (
    <div
      className={`app-shell ${focusMode ? 'app-shell--focus' : ''}`}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <TitleBar />
      <div className="app-shell__content">
        <div className="app-shell__body">
          {!focusMode && sidebarVisible && (
            <div className="app-shell__sidebar">
              <Sidebar />
            </div>
          )}
          <div className="app-shell__main">
            <SplitPane />
          </div>
          {!focusMode && chatPanelVisible && (
            <>
              <div className="app-shell__chat-divider" onPointerDown={onChatDividerDown} />
              <div className="app-shell__chat" style={{ width: chatPanelWidth }}>
                <ChatPanel />
              </div>
            </>
          )}
        </div>
        {!focusMode && transformOpen && (
          <>
            <div className="app-shell__transform-divider" onPointerDown={onTransformDividerDown} />
            <div className="app-shell__transform" style={{ height: transformPanelHeight }}>
              <TransformPanel />
            </div>
          </>
        )}
      </div>
      {!focusMode && <StatusBar />}
      {shortcutsVisible && <ShortcutsOverlay onClose={() => setShortcutsVisible(false)} />}
    </div>
  )
}

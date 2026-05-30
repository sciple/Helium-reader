import './AppShell.css'
import { useCallback, useRef } from 'react'
import TitleBar from '../chrome/TitleBar'
import StatusBar from '../chrome/StatusBar'
import ShortcutsOverlay from '../chrome/ShortcutsOverlay'
import Sidebar from './Sidebar'
import SplitPane from './SplitPane'
import ChatPanel from '../chat/ChatPanel'
import { useUiStore } from '../../store/uiStore'

export default function AppShell() {
  const sidebarVisible = useUiStore((s) => s.sidebarVisible)
  const focusMode = useUiStore((s) => s.focusMode)
  const chatPanelVisible = useUiStore((s) => s.chatPanelVisible)
  const chatPanelWidth = useUiStore((s) => s.chatPanelWidth)
  const setChatPanelWidth = useUiStore((s) => s.setChatPanelWidth)
  const shortcutsVisible = useUiStore((s) => s.shortcutsVisible)
  const setShortcutsVisible = useUiStore((s) => s.setShortcutsVisible)

  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const onDividerPointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true
      startX.current = e.clientX
      startWidth.current = chatPanelWidth
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    []
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return
      const delta = startX.current - e.clientX
      setChatPanelWidth(startWidth.current + delta)
    },
    [setChatPanelWidth]
  )

  const onPointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return (
    <div
      className={`app-shell ${focusMode ? 'app-shell--focus' : ''}`}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <TitleBar />
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
            <div
              className="app-shell__chat-divider"
              onPointerDown={onDividerPointerDown}
            />
            <div className="app-shell__chat" style={{ width: chatPanelWidth }}>
              <ChatPanel />
            </div>
          </>
        )}
      </div>
      {!focusMode && <StatusBar />}
      {shortcutsVisible && <ShortcutsOverlay onClose={() => setShortcutsVisible(false)} />}
    </div>
  )
}

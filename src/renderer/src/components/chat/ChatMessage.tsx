import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useChatStore, type ChatMessage as ChatMessageType } from '../../store/chatStore'
import StreamPhase from './StreamPhase'

marked.setOptions({ breaks: true })

interface Props {
  message: ChatMessageType
  isStreaming?: boolean
  onRemove?: (id: string) => void
}

export default function ChatMessage({ message, isStreaming, onRemove }: Props) {
  const isUser = message.role === 'user'
  const phase = useChatStore((s) => s.phase)
  const phaseStartedAt = useChatStore((s) => s.phaseStartedAt)
  const promptTokensEstimate = useChatStore((s) => s.promptTokensEstimate)
  const pinsReading = useChatStore((s) => s.pinsReading)
  const showPhase = isStreaming && !message.content && phase !== null

  return (
    <div className={`chat-message chat-message--${message.role}`}>
      <div className="chat-message__label">
        {isUser ? 'You' : 'Assistant'}
        {!isStreaming && onRemove && (
          <button
            className="chat-message__remove"
            onClick={() => onRemove(message.id)}
            title="Remove from context"
          >✕</button>
        )}
      </div>
      {isUser ? (
        <div className="chat-message__content chat-message__content--user">
          {message.content}
        </div>
      ) : showPhase ? (
        <StreamPhase phase={phase} startedAt={phaseStartedAt} tokens={promptTokensEstimate} files={pinsReading} stopHint="■ to stop" />
      ) : (
        <div
          className={`chat-message__content chat-message__content--assistant${isStreaming ? ' chat-message__content--streaming' : ''}`}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(marked.parse(message.content || '…') as string)
          }}
        />
      )}
    </div>
  )
}

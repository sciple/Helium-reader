import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { ChatMessage as ChatMessageType } from '../../store/chatStore'

marked.setOptions({ breaks: true })

interface Props {
  message: ChatMessageType
  isStreaming?: boolean
  onRemove?: (id: string) => void
}

export default function ChatMessage({ message, isStreaming, onRemove }: Props) {
  const isUser = message.role === 'user'

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

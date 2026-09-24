import { AIChatMessageLoading } from "./ai-chat-message-loading";
import { AIChatMessage, UserChatMessage } from "./chat-message";
import styles from "./chat-message-list.module.scss";
import type { ChatMessageResponse } from "../../schema/chat";

type ChatMessageListProps = {
  hasPreviousMessages?: boolean;
  isGenerating?: boolean;
  isLoadingPreviousMessages?: boolean;
  messages: ChatMessageResponse[];
  onLoadPreviousMessages?: () => void;
};

export function ChatMessageList({
  hasPreviousMessages = false,
  isGenerating = false,
  isLoadingPreviousMessages = false,
  messages,
  onLoadPreviousMessages,
}: ChatMessageListProps) {
  return (
<div aria-label="채팅 메시지" className={styles.list} role="log">
  {hasPreviousMessages && (
    <button
      disabled={isLoadingPreviousMessages}
      onClick={onLoadPreviousMessages}
      type="button"
    >
      {isLoadingPreviousMessages
        ? "이전 메시지를 불러오는 중..."
        : "이전 메시지 불러오기"}
    </button>
  )}
      {messages.map((message) =>
        message.senderType === "USER" ? (
          <UserChatMessage key={message.messageId} message={message} />
        ) : (
          <AIChatMessage key={message.messageId} message={message} />
        ),
      )}
      {isGenerating && <AIChatMessageLoading />}
    </div>
  );
}

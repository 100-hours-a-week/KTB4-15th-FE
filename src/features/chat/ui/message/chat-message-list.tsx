import { AIChatMessageLoading } from "./ai-chat-message-loading";
import { AIChatMessage, UserChatMessage } from "./chat-message";
import styles from "./chat-message-list.module.scss";
import type { ChatMessageResponse } from "../../api/chat-api.types";

type ChatMessageListProps = {
  isGenerating?: boolean;
  messages: ChatMessageResponse[];
};

export function ChatMessageList({
  isGenerating = false,
  messages,
}: ChatMessageListProps) {
  return (
    <div aria-label="채팅 메시지" className={styles.list} role="log">
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

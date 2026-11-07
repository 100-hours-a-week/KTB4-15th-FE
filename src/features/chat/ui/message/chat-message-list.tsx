"use client";

import { AIChatMessageLoading } from "./ai-chat-message-loading";
import {
  AIChatMessage,
  StreamingAIChatMessage,
  UserChatMessage,
} from "./chat-message";
import styles from "./chat-message-list.module.scss";
import { useChatMessageScroll } from "./use-chat-message-scroll";
import type { ChatMessageResponse } from "../../schema/chat";
import { Spinner } from "@/shared/ui/spinner";
import { Button } from "@/shared/ui/button";
import { formatKoreanDate } from "@/shared/utils/date-format";

type ChatMessageListProps = {
  anchorMessageId?: number | null;
  searchKeyword?: string;
  hasNewerMessages?: boolean;
  onLoadNewerMessages?: () => Promise<void>;
  hasPreviousMessages?: boolean;
  isGenerating?: boolean;
  isLoadingPreviousMessages?: boolean;
  isRetryPending?: boolean;
  messages: ChatMessageResponse[];
  onLoadPreviousMessages?: () => Promise<boolean>;
  onRetryMessage?: (content: string) => void;
  streamingContent?: string;
};

export function ChatMessageList({
  anchorMessageId,
  searchKeyword,
  hasNewerMessages = false,
  onLoadNewerMessages,
  hasPreviousMessages = false,
  isGenerating = false,
  isLoadingPreviousMessages = false,
  isRetryPending = false,
  messages,
  onLoadPreviousMessages,
  onRetryMessage,
  streamingContent = "",
}: ChatMessageListProps) {
  const {
    listRef,
    loadMoreRef,
    loadNewerRef,
    latestMessageId,
    unreadReplyId,
    scrollToReply,
  } = useChatMessageScroll({
    anchorMessageId,
    hasNewerMessages,
    hasPreviousMessages,
    messages,
    onLoadNewerMessages,
    onLoadPreviousMessages,
  });

  const messageGroups = messages.reduce<
    Array<{
      dateLabel: string;
      firstMessageCreatedAt: string;
      messages: ChatMessageResponse[];
    }>
  >((groups, message) => {
    const dateLabel = formatKoreanDate(message.createdAt);
    const latestGroup = groups.at(-1);

    if (latestGroup?.dateLabel === dateLabel) {
      latestGroup.messages.push(message);
      return groups;
    }

    groups.push({
      dateLabel,
      firstMessageCreatedAt: message.createdAt,
      messages: [message],
    });
    return groups;
  }, []);

  return (
    <div
      aria-label="채팅 메시지"
      className={styles.list}
      ref={listRef}
      role="log"
    >
      <div
        aria-hidden="true"
        className={styles.loadMoreTrigger}
        ref={loadMoreRef}
      />
      {isLoadingPreviousMessages && (
        <div className={styles.previousMessagesLoading}>
          <Spinner label="이전 메시지를 불러오는 중" />
        </div>
      )}
      {messageGroups.map((group) => (
        <section
          aria-label={group.dateLabel}
          className={styles.dateGroup}
          key={group.dateLabel}
        >
          <time
            className={styles.dateDivider}
            dateTime={group.firstMessageCreatedAt}
          >
            {group.dateLabel}
          </time>
          {group.messages.map((message) => (
            <div
              className={message.senderType === "AI" ? styles.reply : undefined}
              data-message-id={message.messageId}
              key={message.messageId}
            >
              {message.senderType === "USER" ? (
                <UserChatMessage
                  highlightKeyword={
                    message.messageId === anchorMessageId
                      ? searchKeyword
                      : undefined
                  }
                  canRetry={
                    !hasNewerMessages &&
                    message.messageId === latestMessageId &&
                    message.generationStatus === "FAILED"
                  }
                  isRetryPending={isRetryPending}
                  message={message}
                  onRetryMessage={onRetryMessage}
                />
              ) : (
                <AIChatMessage
                  message={message}
                  highlightKeyword={
                    message.messageId === anchorMessageId
                      ? searchKeyword
                      : undefined
                  }
                />
              )}
            </div>
          ))}
        </section>
      ))}
      {hasNewerMessages && <div aria-hidden="true" ref={loadNewerRef} />}
      {unreadReplyId != null && (
        <div className={styles.newReply}>
          <Button
            aria-label="새 답변 보기"
            className={styles.newReplyButton}
            onClick={() => scrollToReply(unreadReplyId)}
            size="small"
            variant="secondary"
          >
            ↓ 새 답변 도착
          </Button>
        </div>
      )}
      {streamingContent ? (
        <StreamingAIChatMessage content={streamingContent} />
      ) : (
        isGenerating && <AIChatMessageLoading />
      )}
    </div>
  );
}

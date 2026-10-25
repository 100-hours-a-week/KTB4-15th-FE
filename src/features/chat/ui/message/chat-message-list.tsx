"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AIChatMessageLoading } from "./ai-chat-message-loading";
import {
  AIChatMessage,
  StreamingAIChatMessage,
  UserChatMessage,
} from "./chat-message";
import styles from "./chat-message-list.module.scss";
import type { ChatMessageResponse } from "../../schema/chat";
import { Button } from "@/shared/ui/button";
import { formatKoreanDate } from "@/shared/utils/date-format";

type ChatMessageListProps = {
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
  hasPreviousMessages = false,
  isGenerating = false,
  isLoadingPreviousMessages = false,
  isRetryPending = false,
  messages,
  onLoadPreviousMessages,
  onRetryMessage,
  streamingContent = "",
}: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [unreadReplyId, setUnreadReplyId] = useState<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingPreviousMessagesRef = useRef(false);
  const didInitialScrollRef = useRef(false);
  const latestMessageId = messages.at(-1)?.messageId;
  const previousLatestMessageIdRef = useRef<number | undefined>(undefined);
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

  const scrollToReply = (messageId: number) => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`)
      ?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    setUnreadReplyId(null);
  };

  useEffect(() => {
    const updatePosition = () => {
      isNearBottomRef.current =
        document.documentElement.scrollHeight -
          window.scrollY -
          window.innerHeight <
        120;
      if (isNearBottomRef.current) setUnreadReplyId(null);
    };
    window.addEventListener("scroll", updatePosition, { passive: true });
    return () => window.removeEventListener("scroll", updatePosition);
  }, []);

  useLayoutEffect(() => {
    if (latestMessageId == null) return;
    const previousId = previousLatestMessageIdRef.current;
    if (previousId === latestMessageId) return;

    const latestMessage = messages.at(-1)!;
    const initial = previousId == null;
    const shouldFollow =
      initial || latestMessage.senderType === "USER" || isNearBottomRef.current;
    const frameId = requestAnimationFrame(() => {
      previousLatestMessageIdRef.current = latestMessageId;
      if (initial || latestMessage.senderType === "USER") {
        setUnreadReplyId(null);
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior:
            initial ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
        });
      } else if (shouldFollow) {
        scrollToReply(latestMessageId);
      } else {
        setUnreadReplyId(latestMessageId);
      }
      didInitialScrollRef.current = true;
    });
    return () => cancelAnimationFrame(frameId);
  }, [latestMessageId, messages]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (
      loadMoreElement == null ||
      !hasPreviousMessages ||
      onLoadPreviousMessages == null
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          !entry.isIntersecting ||
          !didInitialScrollRef.current ||
          isLoadingPreviousMessagesRef.current
        ) {
          return;
        }

        const previousScrollHeight = document.documentElement.scrollHeight;
        const previousScrollY = window.scrollY;

        isLoadingPreviousMessagesRef.current = true;
        void onLoadPreviousMessages()
          .then((succeeded) => {
            if (!succeeded) return;
            requestAnimationFrame(() => {
              const addedHeight =
                document.documentElement.scrollHeight - previousScrollHeight;
              window.scrollTo({
                top: previousScrollY + addedHeight,
                behavior: "auto",
              });
            });
          })
          .finally(() => {
            isLoadingPreviousMessagesRef.current = false;
          });
      },
      {
        rootMargin: "200px 0px 0px",
      },
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [hasPreviousMessages, onLoadPreviousMessages]);

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
        <div
          aria-label="이전 메시지를 불러오는 중"
          className={styles.previousMessagesLoading}
          role="status"
        >
          <span className={styles.spinner} />
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
          {group.messages.map((message) =>
            message.senderType === "USER" ? (
              <UserChatMessage
                canRetry={
                  message.messageId === latestMessageId &&
                  message.generationStatus === "FAILED"
                }
                isRetryPending={isRetryPending}
                key={message.messageId}
                message={message}
                onRetryMessage={onRetryMessage}
              />
            ) : (
              <div
                className={styles.reply}
                data-message-id={message.messageId}
                key={message.messageId}
              >
                <AIChatMessage message={message} />
              </div>
            ),
          )}
        </section>
      ))}
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

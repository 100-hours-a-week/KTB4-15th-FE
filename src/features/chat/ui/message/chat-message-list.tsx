"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { AIChatMessageLoading } from "./ai-chat-message-loading";
import { AIChatMessage, UserChatMessage } from "./chat-message";
import styles from "./chat-message-list.module.scss";
import type { ChatMessageResponse } from "../../schema/chat";

type ChatMessageListProps = {
  hasPreviousMessages?: boolean;
  isGenerating?: boolean;
  isLoadingPreviousMessages?: boolean;
  messages: ChatMessageResponse[];
  onLoadPreviousMessages?: () => Promise<unknown>;
};

export function ChatMessageList({
  hasPreviousMessages = false,
  isGenerating = false,
  isLoadingPreviousMessages = false,
  messages,
  onLoadPreviousMessages,
}: ChatMessageListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const didInitialScrollRef = useRef(false);
  const latestMessageId = messages.at(-1)?.messageId;
  const previousLatestMessageIdRef = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (latestMessageId == null) {
      return;
    }

    const isInitialScroll = !didInitialScrollRef.current;
    const hasNewLatestMessage =
      previousLatestMessageIdRef.current != null &&
      previousLatestMessageIdRef.current !== latestMessageId;

    previousLatestMessageIdRef.current = latestMessageId;

    if (!isInitialScroll && !hasNewLatestMessage) {
      return;
    }

    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "auto",
    });
    didInitialScrollRef.current = true;
  }, [latestMessageId]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (
      loadMoreElement == null ||
      !hasPreviousMessages ||
      isLoadingPreviousMessages ||
      onLoadPreviousMessages == null
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || !didInitialScrollRef.current) {
          return;
        }

        const previousScrollHeight = document.documentElement.scrollHeight;
        const previousScrollY = window.scrollY;

        void onLoadPreviousMessages().then(() => {
          requestAnimationFrame(() => {
            const addedHeight =
              document.documentElement.scrollHeight - previousScrollHeight;
            window.scrollTo({
              top: previousScrollY + addedHeight,
              behavior: "auto",
            });
          });
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
  }, [hasPreviousMessages, isLoadingPreviousMessages, onLoadPreviousMessages]);

  return (
    <div aria-label="채팅 메시지" className={styles.list} role="log">
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

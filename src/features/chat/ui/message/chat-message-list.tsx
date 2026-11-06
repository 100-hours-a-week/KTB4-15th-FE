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
import { Spinner } from "@/shared/ui/spinner";
import { Button } from "@/shared/ui/button";
import { formatKoreanDate } from "@/shared/utils/date-format";

type ChatMessageListProps = {
  anchorMessageId?: number | null;
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
  const listRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [unreadReplyId, setUnreadReplyId] = useState<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadNewerRef = useRef<HTMLDivElement>(null);
  const loadingNewerRef = useRef(false);
  const hadNewerMessagesRef = useRef(hasNewerMessages);
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
    return () => {
      if (anchorMessageId == null) return;
      previousLatestMessageIdRef.current = undefined;
      didInitialScrollRef.current = false;
    };
  }, [anchorMessageId]);

  useLayoutEffect(() => {
    if (latestMessageId == null) return;
    const previousId = previousLatestMessageIdRef.current;
    const hadNewerMessages = hadNewerMessagesRef.current;
    hadNewerMessagesRef.current = hasNewerMessages;

    if (previousId == null && anchorMessageId != null) {
      const target = listRef.current?.querySelector<HTMLElement>(
        `[data-message-id="${anchorMessageId}"]`,
      );
      target?.scrollIntoView({ block: "center", behavior: "instant" });
      isNearBottomRef.current =
        document.documentElement.scrollHeight -
          window.scrollY -
          window.innerHeight <
        120;
      previousLatestMessageIdRef.current = latestMessageId;
      didInitialScrollRef.current = true;
      return;
    }

    if (previousId != null && hadNewerMessages) {
      previousLatestMessageIdRef.current = latestMessageId;
      return;
    }
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
  }, [anchorMessageId, hasNewerMessages, latestMessageId, messages]);

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

        const firstMessage =
          listRef.current?.querySelector("[data-message-id]");
        if (!firstMessage) return;
        const previousScrollY = window.scrollY;
        const previousTop =
          firstMessage.getBoundingClientRect().top + previousScrollY;

        isLoadingPreviousMessagesRef.current = true;
        void onLoadPreviousMessages()
          .then((succeeded) => {
            if (!succeeded) return;
            requestAnimationFrame(() => {
              if (!firstMessage.isConnected) return;
              const addedHeight =
                firstMessage.getBoundingClientRect().top +
                window.scrollY -
                previousTop;
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

  useEffect(() => {
    const trigger = loadNewerRef.current;
    if (!hasNewerMessages || !trigger || !onLoadNewerMessages) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          !entry.isIntersecting ||
          !didInitialScrollRef.current ||
          loadingNewerRef.current
        )
          return;
        loadingNewerRef.current = true;
        void onLoadNewerMessages().finally(() => {
          loadingNewerRef.current = false;
        });
      },
      { rootMargin: "0px 0px 200px" },
    );
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasNewerMessages, latestMessageId, onLoadNewerMessages]);

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
              className={`${message.senderType === "AI" ? styles.reply : ""} ${message.messageId === anchorMessageId ? styles.anchor : ""}`}
              data-message-id={message.messageId}
              key={message.messageId}
            >
              {message.senderType === "USER" ? (
                <UserChatMessage
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
                <AIChatMessage message={message} />
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

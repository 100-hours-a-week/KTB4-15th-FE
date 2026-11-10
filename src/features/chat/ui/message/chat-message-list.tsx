"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  defaultRangeExtractor,
  useWindowVirtualizer,
} from "@tanstack/react-virtual";
import { ChatProductState } from "../product/chat-product-state";
import { AIChatMessageLoading } from "./ai-chat-message-loading";
import {
  AIChatMessage,
  StreamingAIChatMessage,
  UserChatMessage,
} from "./chat-message";
import styles from "./chat-message-list.module.scss";
import { useChatMessageScroll } from "../../hooks/use-chat-message-scroll";
import type { ChatMessageResponse } from "../../schema/chat";
import { Spinner } from "@/shared/ui/spinner";
import { Button } from "@/shared/ui/button";
import { formatKoreanDate } from "@/shared/utils/date-format";

const messageDateLabels = new WeakMap<ChatMessageResponse, string>();

type ChatMessageListProps = {
  anchorMessageId?: number | null;
  initialMessageId?: number;
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
  onRetryStream?: () => void;
  streamingContent?: string;
};

export function ChatMessageList({
  anchorMessageId,
  initialMessageId,
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
  onRetryStream,
  streamingContent = "",
}: ChatMessageListProps) {
  const [products, setProducts] = useState<
    NonNullable<React.ContextType<typeof ChatProductState>>["products"]
  >({});
  const productState = useMemo(() => ({ products, setProducts }), [products]);
  const { firstDate, rows } = useMemo(() => {
    const rows: Array<
      | { key: string; dateLabel: string; createdAt: string }
      | { key: number; message: ChatMessageResponse }
    > = [];
    let firstDate: { label: string; createdAt: string } | undefined;
    let previousDate: string | undefined;
    for (const message of messages) {
      let dateLabel = messageDateLabels.get(message);
      if (dateLabel === undefined) {
        dateLabel = formatKoreanDate(message.createdAt);
        messageDateLabels.set(message, dateLabel);
      }
      if (dateLabel !== previousDate) {
        // 맨 위에서는 날짜 구분선 대신 첫 메시지를 위치 보정 기준으로 삼는다.
        if (firstDate === undefined) {
          firstDate = { label: dateLabel, createdAt: message.createdAt };
        } else {
          rows.push({
            key: dateLabel,
            dateLabel,
            createdAt: message.createdAt,
          });
        }
        previousDate = dateLabel;
      }
      rows.push({ key: message.messageId, message });
    }
    return { firstDate, rows };
  }, [messages]);

  const windowRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    const update = () => {
      const element = windowRef.current;
      if (element)
        setScrollMargin(element.getBoundingClientRect().top + window.scrollY);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [firstDate?.label]);

  const firstMessageId = messages[0]?.messageId;
  const [previousFirstMessageId, setPreviousFirstMessageId] =
    useState(firstMessageId);
  const isPrepending =
    previousFirstMessageId != null && firstMessageId !== previousFirstMessageId;
  if (firstMessageId !== previousFirstMessageId) {
    setPreviousFirstMessageId(firstMessageId);
  }

  const streamingReplyRef = useRef<HTMLDivElement>(null);
  const streamingReplySize = useRef<{ userMessageId: number; height: number }>(
    null,
  );
  const lastMessage = messages.at(-1);
  const hasStreamingContent = streamingContent.length > 0;

  useLayoutEffect(() => {
    if (
      !hasStreamingContent ||
      onRetryStream ||
      lastMessage?.senderType !== "USER"
    )
      return;
    const element = streamingReplyRef.current;
    if (!element) return;

    const measure = () => {
      streamingReplySize.current = {
        userMessageId: lastMessage.messageId,
        height: element.offsetHeight,
      };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasStreamingContent, lastMessage, onRetryStream]);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    getItemKey: (index) => rows[index].key,
    estimateSize: (index) => {
      const row = rows[index];
      if (!("message" in row)) return 44;
      const measuredReply = streamingReplySize.current;
      // 완료 행은 스트리밍 중에 측정한 높이에서 시작한다.
      if (
        row.message === lastMessage &&
        row.message.senderType === "AI" &&
        measuredReply != null &&
        measuredReply.userMessageId === messages.at(-2)?.messageId
      ) {
        return measuredReply.height;
      }
      return row.message.recommendation?.products.length ? 600 : 100;
    },
    overscan: 16,
    scrollMargin,
    anchorTo: isPrepending ? "end" : "start",
    rangeExtractor: (range) =>
      messages.length <= 80
        ? rows.map((_, index) => index)
        : defaultRangeExtractor(range),
  });

  const scrollToMessage = useCallback(
    (
      messageId: number,
      align: "start" | "center",
      behavior: "instant" | "smooth" = "instant",
    ) => {
      const index = rows.findIndex((row) => row.key === messageId);
      if (index >= 0) virtualizer.scrollToIndex(index, { align, behavior });
    },
    [rows, virtualizer],
  );

  const {
    listRef,
    isInitialPositioned,
    loadMoreRef,
    loadNewerRef,
    latestMessageId,
    unreadReplyId,
    dismissUnreadReply,
    scrollToReply,
  } = useChatMessageScroll({
    anchorMessageId,
    hasNewerMessages,
    hasPreviousMessages,
    messages,
    onLoadNewerMessages,
    onLoadPreviousMessages,
    scrollToMessage,
  });

  const observeUnreadReply = useCallback(
    (element: HTMLDivElement | null) => {
      virtualizer.measureElement(element);
      const reply = element?.querySelector("article");
      if (!reply) return;

      const style = getComputedStyle(reply);
      const headerHeight = parseFloat(
        style.getPropertyValue("--header-height"),
      );
      const composerHeight = parseFloat(
        style.getPropertyValue("--chat-composer-height"),
      );
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) dismissUnreadReply();
        },
        {
          rootMargin: `-${headerHeight || 0}px 0px -${composerHeight || 0}px 0px`,
        },
      );
      observer.observe(reply);
      return () => observer.disconnect();
    },
    [dismissUnreadReply, virtualizer],
  );

  const virtualRows = virtualizer.getVirtualItems();
  const firstRow = virtualRows[0];
  const lastRow = virtualRows.at(-1);
  const unrenderedEnd = lastRow
    ? virtualizer.getTotalSize() - (lastRow.end - scrollMargin)
    : 0;
  const initialIndex =
    !isInitialPositioned && initialMessageId != null
      ? rows.findIndex((row) => row.key === initialMessageId)
      : -1;
  const visibleRows =
    initialIndex >= 0 && virtualRows.length === 0
      ? [{ index: initialIndex, key: rows[initialIndex].key, start: 0 }]
      : virtualRows;

  return (
    <ChatProductState.Provider value={productState}>
      <div
        aria-label="채팅 메시지"
        className={styles.list}
        ref={listRef}
        role="log"
        data-loaded-message-count={messages.length}
        data-initial-positioned={isInitialPositioned}
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
        <div>
          {firstDate && (
            <div className={styles.firstDate}>
              <time
                className={styles.dateDivider}
                dateTime={firstDate.createdAt}
              >
                {firstDate.label}
              </time>
            </div>
          )}
          <div
            ref={windowRef}
            className={styles.messageWindow}
            style={{
              paddingBlockEnd: Math.max(0, unrenderedEnd),
            }}
          >
            <div
              data-chat-server-fallback={
                initialIndex >= 0 && !firstRow ? "" : undefined
              }
              style={{
                marginBlockStart: firstRow ? firstRow.start - scrollMargin : 0,
              }}
            >
              {visibleRows.map((item) => {
                const row = rows[item.index];
                const message = "message" in row ? row.message : undefined;
                return (
                  <div
                    className={styles.messageRow}
                    data-index={item.index}
                    data-chat-initial-message={
                      item.index === initialIndex ? "" : undefined
                    }
                    data-message-id={message?.messageId}
                    key={item.key}
                    ref={
                      unreadReplyId != null &&
                      message?.messageId === unreadReplyId
                        ? observeUnreadReply
                        : virtualizer.measureElement
                    }
                  >
                    {"dateLabel" in row && (
                      <time
                        className={styles.dateDivider}
                        dateTime={row.createdAt}
                      >
                        {row.dateLabel}
                      </time>
                    )}
                    {message &&
                      (message.senderType === "USER" ? (
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
                          initialImages={message.messageId === initialMessageId}
                          highlightKeyword={
                            message.messageId === anchorMessageId
                              ? searchKeyword
                              : undefined
                          }
                        />
                      ))}
                  </div>
                );
              })}
            </div>
          </div>
          {(streamingContent || isGenerating || onRetryStream) && (
            <div className={styles.pendingReply} ref={streamingReplyRef}>
              {streamingContent ? (
                <StreamingAIChatMessage content={streamingContent} />
              ) : (
                isGenerating && <AIChatMessageLoading />
              )}
              {onRetryStream && (
                <AIChatMessageLoading onRetry={onRetryStream} />
              )}
            </div>
          )}
        </div>
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
      </div>
    </ChatProductState.Provider>
  );
}

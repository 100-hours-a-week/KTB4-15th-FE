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
  onRetryStream?: () => void;
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
      const dateLabel = formatKoreanDate(message.createdAt);
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

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    getItemKey: (index) => rows[index].key,
    estimateSize: (index) => {
      const row = rows[index];
      if (!("message" in row)) return 44;
      return row.message.recommendation?.products.length ? 600 : 100;
    },
    overscan: 16,
    scrollMargin,
    anchorTo: "end",
    rangeExtractor: (range) =>
      messages.length <= 80
        ? rows.map((_, index) => index)
        : defaultRangeExtractor(range),
  });

  const scrollToMessage = useCallback(
    (messageId: number, align: "start" | "center") => {
      const index = rows.findIndex((row) => row.key === messageId);
      if (index >= 0)
        virtualizer.scrollToIndex(index, { align, behavior: "instant" });
    },
    [rows, virtualizer],
  );

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
    scrollToMessage,
  });

  return (
    <ChatProductState.Provider value={productState}>
      <div
        aria-label="채팅 메시지"
        className={styles.list}
        ref={listRef}
        role="log"
        data-loaded-message-count={messages.length}
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
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((item) => {
              const row = rows[item.index];
              const message = "message" in row ? row.message : undefined;
              return (
                <div
                  className={styles.virtualRow}
                  data-index={item.index}
                  data-message-id={message?.messageId}
                  key={item.key}
                  ref={virtualizer.measureElement}
                  style={{
                    transform: `translateY(${item.start - scrollMargin}px)`,
                  }}
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
        {onRetryStream && <AIChatMessageLoading onRetry={onRetryStream} />}
      </div>
    </ChatProductState.Provider>
  );
}

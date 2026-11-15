import { memo } from "react";
import Image from "next/image";
import type { AIMessageResponse, UserMessageResponse } from "../../schema/chat";
import aiImage from "@/shared/assets/ai-avatar.webp";
import { formatKoreanTime } from "@/shared/utils/date-format";
import { Button } from "@/shared/ui/button";
import { InfoIcon, RetryIcon } from "@/shared/ui/icon";
import styles from "./chat-message.module.scss";
import { RecommendedProductList } from "../product/recommended-product-list";

import { HighlightedChatText } from "./highlighted-chat-text";

type UserChatMessageProps = {
  highlightKeyword?: string;
  canRetry?: boolean;
  isRetryPending?: boolean;
  message: UserMessageResponse;
  onRetryMessage?: (content: string) => void;
};

type AIChatMessageProps = {
  highlightKeyword?: string;
  message: AIMessageResponse;
};

export function StreamingAIChatMessage({ content }: { content: string }) {
  return (
    <article className={styles.aiMessage}>
      <Image
        alt="AI 스타일리스트"
        className={styles.avatar}
        sizes="40px"
        src={aiImage}
        unoptimized
      />
      <div className={styles.aiContent}>
        <div className={styles.aiMeta}>
          <strong className={styles.aiName}>AI 스타일리스트</strong>
        </div>
        <p className={styles.aiBubble}>{content}</p>
        <span className={styles.visuallyHidden} role="status">
          AI 스타일리스트가 답변을 작성하고 있어요
        </span>
      </div>
    </article>
  );
}

export function ChatMessageRetry({
  align = "end",
  isPending = false,
  label = "다시 시도",
  message,
  onRetry,
}: {
  align?: "start" | "end";
  isPending?: boolean;
  label?: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={styles.retryArea} data-align={align}>
      <p className={styles.retryMessage} role="alert">
        <InfoIcon />
        {message}
      </p>
      <Button
        isLoading={isPending}
        leadingIcon={<RetryIcon />}
        onClick={onRetry}
        size="small"
        variant="outlined"
      >
        {label}
      </Button>
    </div>
  );
}

export const UserChatMessage = memo(function UserChatMessage({
  canRetry = false,
  highlightKeyword,
  isRetryPending = false,
  message,
  onRetryMessage,
}: UserChatMessageProps) {
  return (
    <article className={styles.userMessageContainer}>
      <div className={styles.userMessage}>
        <time className={styles.time} dateTime={message.createdAt}>
          {formatKoreanTime(message.createdAt)}
        </time>
        <div className={styles.userBubble}>
          <HighlightedChatText
            text={message.content}
            keyword={highlightKeyword}
          />
        </div>
      </div>
      {canRetry && onRetryMessage && (
        <ChatMessageRetry
          isPending={isRetryPending}
          message="문제가 발생했습니다. 다시 시도해 주세요."
          onRetry={() => onRetryMessage(message.content)}
        />
      )}
    </article>
  );
});

export const AIChatMessage = memo(function AIChatMessage({
  message,
  highlightKeyword,
}: AIChatMessageProps) {
  return (
    <article className={styles.aiMessage}>
      <Image
        alt="AI 스타일리스트"
        className={styles.avatar}
        sizes="40px"
        src={aiImage}
        unoptimized
      />
      <div className={styles.aiContent}>
        <div className={styles.aiMeta}>
          <strong className={styles.aiName}>AI 스타일리스트</strong>
          <time
            className={`${styles.time} ${styles.aiTime}`}
            dateTime={message.createdAt}
          >
            {formatKoreanTime(message.createdAt)}
          </time>
        </div>
        <p className={styles.aiBubble}>
          <HighlightedChatText
            text={message.content}
            keyword={highlightKeyword}
          />
        </p>
        {message.recommendation && (
          <RecommendedProductList products={message.recommendation.products} />
        )}
      </div>
    </article>
  );
});

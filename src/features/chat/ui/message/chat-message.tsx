import Image from "next/image";
import type { AIMessageResponse, UserMessageResponse } from "../../schema/chat";
import aiImage from "../../icon/ai.png";
import { formatKoreanTime } from "@/shared/utils/date-format";
import { Button } from "@/shared/ui/button";
import { InfoIcon, RetryIcon } from "@/shared/ui/icon";
import styles from "./chat-message.module.scss";
import { RecommendedProductList } from "../product/recommended-product-list";

type UserChatMessageProps = {
  canRetry?: boolean;
  isRetryPending?: boolean;
  message: UserMessageResponse;
  onRetryMessage?: (content: string) => void;
};

type AIChatMessageProps = {
  message: AIMessageResponse;
};

export function UserChatMessage({
  canRetry = false,
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
        <div className={styles.userBubble}>{message.content}</div>
      </div>
      {canRetry && onRetryMessage && (
        <div className={styles.retryArea}>
          <p className={styles.retryMessage} role="alert">
            <InfoIcon />
            문제가 발생했습니다. 다시 시도해 주세요.
          </p>
          <Button
            isLoading={isRetryPending}
            leadingIcon={<RetryIcon />}
            onClick={() => onRetryMessage(message.content)}
            size="small"
            variant="outlined"
          >
            다시 시도
          </Button>
        </div>
      )}
    </article>
  );
}

export function AIChatMessage({ message }: AIChatMessageProps) {
  return (
    <article className={styles.aiMessage}>
      <Image alt="AI 스타일리스트" className={styles.avatar} src={aiImage} />
      <div className={styles.aiContent}>
        <div className={styles.aiMeta}>
          <strong className={styles.aiName}>AI 스타일리스트</strong>
          <span className={styles.aiBadge}>스타일리스트</span>
          <time
            className={`${styles.time} ${styles.aiTime}`}
            dateTime={message.createdAt}
          >
            {formatKoreanTime(message.createdAt)}
          </time>
        </div>
        <p className={styles.aiBubble}>{message.content}</p>
        {message.recommendation && (
          <RecommendedProductList products={message.recommendation.products} />
        )}
      </div>
    </article>
  );
}

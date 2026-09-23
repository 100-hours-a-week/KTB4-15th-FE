import Image from "next/image";
import type { AIMessageResponse, UserMessageResponse } from "../../schema/chat";
import aiImage from "../../icon/ai.png";
import { formatKoreanTime } from "@/shared/utils/date-format";
import styles from "./chat-message.module.scss";
import { RecommendedProductList } from "../product/recommended-product-list";

type UserChatMessageProps = {
  message: UserMessageResponse;
};

type AIChatMessageProps = {
  message: AIMessageResponse;
};

export function UserChatMessage({ message }: UserChatMessageProps) {
  return (
    <article className={styles.userMessage}>
      <time className={styles.time} dateTime={message.createdAt}>
        {formatKoreanTime(message.createdAt)}
      </time>
      <div className={styles.userBubble}>{message.content}</div>
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

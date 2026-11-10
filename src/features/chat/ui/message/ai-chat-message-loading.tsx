import Image from "next/image";
import { ChatMessageRetry } from "./chat-message";
import aiImage from "@/shared/assets/ai-avatar.webp";
import styles from "./ai-chat-message-loading.module.scss";

export function AIChatMessageLoading({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      aria-label={
        onRetry ? undefined : "AI 스타일리스트가 답변을 작성하고 있어요"
      }
      aria-live={onRetry ? undefined : "polite"}
      className={styles.loadingMessage}
      role={onRetry ? undefined : "status"}
    >
      <Image
        alt=""
        aria-hidden="true"
        className={styles.avatar}
        sizes="40px"
        src={aiImage}
        unoptimized
      />
      <div className={styles.content}>
        <div className={styles.meta}>
          <strong className={styles.name}>AI 스타일리스트</strong>
        </div>
        {onRetry ? (
          <ChatMessageRetry
            align="start"
            message="답변 연결이 끊겼어요."
            onRetry={onRetry}
          />
        ) : (
          <span aria-hidden="true" className={styles.bubble}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
        )}
      </div>
    </div>
  );
}

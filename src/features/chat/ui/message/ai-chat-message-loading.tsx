import Image from "next/image";
import aiImage from "../../icon/ai.png";
import styles from "./ai-chat-message-loading.module.scss";

export function AIChatMessageLoading() {
  return (
    <div
      aria-label="AI 스타일리스트가 답변을 작성하고 있어요"
      aria-live="polite"
      className={styles.loadingMessage}
      role="status"
    >
      <Image
        alt=""
        aria-hidden="true"
        className={styles.avatar}
        src={aiImage}
      />
      <span aria-hidden="true" className={styles.bubble}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
    </div>
  );
}

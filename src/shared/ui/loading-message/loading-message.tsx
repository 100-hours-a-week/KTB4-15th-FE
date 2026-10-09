import type { ReactNode } from "react";
import styles from "./loading-message.module.scss";

interface LoadingMessageProps {
  children: ReactNode;
  className?: string;
}

export function LoadingMessage({ children, className }: LoadingMessageProps) {
  return (
    <p
      aria-live="polite"
      className={`${styles.message} ${className ?? ""}`}
      role="status"
    >
      <span>
        {children}
        <span aria-hidden="true" className={styles.dots}>
          <span />
          <span />
          <span />
        </span>
      </span>
    </p>
  );
}

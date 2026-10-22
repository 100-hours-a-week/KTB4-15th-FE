import type { ReactNode } from "react";
import { LoadingDots } from "./loading-dots";
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
        <LoadingDots />
      </span>
    </p>
  );
}

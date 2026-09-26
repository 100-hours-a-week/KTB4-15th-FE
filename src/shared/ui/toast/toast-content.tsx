import { CloseIcon } from "@/shared/ui/icon";
import styles from "./toast.module.scss";

type ToastType = "success" | "error";

type ToastContentProps = {
  message: string;
  onClose: () => void;
  type: ToastType;
};

function StatusIcon({ type }: { type: ToastType }) {
  if (type === "success") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path
          d="m5.5 10 3 3 6-6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 5.5V11M10 14h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ToastContent({ message, onClose, type }: ToastContentProps) {
  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.statusIcon}>
        <StatusIcon type={type} />
      </span>
      <p>{message}</p>
      <button
        aria-label="알림 닫기"
        className={styles.closeButton}
        onClick={onClose}
        type="button"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

import { CloseIcon } from "@/shared/ui/icon";
import { Button } from "@/shared/ui/button";
import styles from "./toast.module.scss";

type ToastType = "success" | "error";

export type ToastAction = { label: string; onClick: () => void };

type ToastContentProps = {
  message: string;
  onClose: () => void;
  type: ToastType;
  action?: ToastAction;
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

export function ToastContent({
  message,
  onClose,
  type,
  action,
}: ToastContentProps) {
  return (
    <div
      className={`${styles.toast} ${styles[type]} ${action ? styles.withAction : ""}`}
    >
      <span className={styles.statusIcon}>
        <StatusIcon type={type} />
      </span>
      <p>{message}</p>
      {action && (
        <Button
          className={styles.actionButton}
          onClick={() => {
            action.onClick();
            onClose();
          }}
          size="small"
          variant="text"
        >
          {action.label}
        </Button>
      )}
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

import { toast } from "sonner";
import { ToastContent } from "./toast-content";
import styles from "./toast.module.scss";

export type ToastId = string | number;

export type ToastOptions = {
  duration?: number;
  id?: ToastId;
};

type ToastType = "success" | "error";

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  error: 4000,
};

function show(type: ToastType, message: string, options?: ToastOptions) {
  return toast.custom(
    (toastId) => (
      <ToastContent
        message={message}
        onClose={() => toast.dismiss(toastId)}
        type={type}
      />
    ),
    {
      className: styles.toastItem,
      duration: options?.duration ?? DEFAULT_DURATION[type],
      id: options?.id,
    },
  );
}

export const showToast = {
  success(message: string, options?: ToastOptions) {
    return show("success", message, options);
  },
  error(message: string, options?: ToastOptions) {
    return show("error", message, options);
  },
  dismiss(id?: ToastId) {
    toast.dismiss(id);
  },
};

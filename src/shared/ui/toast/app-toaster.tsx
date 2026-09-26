"use client";

import { Toaster } from "sonner";
import styles from "./toast.module.scss";

export function AppToaster() {
  return (
    <Toaster
      className={styles.toaster}
      containerAriaLabel="알림"
      expand={false}
      gap={8}
      mobileOffset={{
        bottom: "calc(env(safe-area-inset-bottom) + var(--space-lg))",
      }}
      offset={{
        bottom: "calc(env(safe-area-inset-bottom) + var(--space-lg))",
      }}
      position="bottom-center"
      swipeDirections={["left", "right"]}
      visibleToasts={3}
    />
  );
}

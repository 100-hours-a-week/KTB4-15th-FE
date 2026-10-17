"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fittingQueryKeys } from "@/features/fitting";
import { NotificationUnreadContext } from "@/shared/ui/header/notification-context";
import { showToast } from "@/shared/ui/toast";
import { connectNotificationStream } from "./api/notification";

const RECONNECT_DELAY = 3000;
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [hasUnread, setHasUnread] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    async function connect() {
      controller = new AbortController();

      try {
        for await (const event of connectNotificationStream(
          controller.signal,
        )) {
          if (event.event === "connected") {
            setHasUnread(event.hasUnread);
            continue;
          }

          setHasUnread(true);
          void queryClient.invalidateQueries({
            queryKey: fittingQueryKeys.currentJob,
          });
          const message =
            event.type === "FITTING_SUCCESS"
              ? "가상 피팅이 완성되었어요."
              : "가상 피팅 생성에 실패했어요.";

          if (event.type === "FITTING_SUCCESS") {
            showToast.success(message);
          } else {
            showToast.error(message);
          }
        }
      } catch {
        if (controller.signal.aborted) return;
      }

      if (!stopped) reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
    }

    void connect();

    return () => {
      stopped = true;
      controller?.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [queryClient]);

  return (
    <NotificationUnreadContext value={hasUnread}>
      {children}
    </NotificationUnreadContext>
  );
}

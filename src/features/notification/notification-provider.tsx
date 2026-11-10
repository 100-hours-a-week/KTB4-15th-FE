"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fittingQueryKeys } from "@/features/fitting/model/fitting-query";
import { NotificationUnreadContext } from "@/shared/ui/header/notification-context";
import { showToast } from "@/shared/ui/toast";
import { connectNotificationStream } from "./api/notification";
import {
  notificationQueryKeys,
  notificationUnreadQueryOptions,
} from "./model/notification-query";
import type { NotificationUnreadStatus } from "./schema/notification";

const RECONNECT_DELAY = 3000;
export function NotificationProvider({
  children,
  initialUnreadStatus,
}: {
  children: ReactNode;
  initialUnreadStatus?: NotificationUnreadStatus;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  const queryClient = useQueryClient();
  const { data: unreadStatus } = useQuery({
    ...notificationUnreadQueryOptions,
    initialData: initialUnreadStatus,
    refetchOnMount: initialUnreadStatus == null,
  });

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    async function connect() {
      controller = new AbortController();
      const startedAt = Date.now();

      console.info("[notification-sse] connecting");

      try {
        for await (const event of connectNotificationStream(
          controller.signal,
        )) {
          if (event.event === "connected") {
            console.info("[notification-sse] connected");
            queryClient.setQueryData<NotificationUnreadStatus>(
              notificationQueryKeys.unread,
              { hasUnread: event.hasUnread },
            );
            continue;
          }

          queryClient.setQueryData<NotificationUnreadStatus>(
            notificationQueryKeys.unread,
            { hasUnread: true },
          );
          void queryClient.invalidateQueries({
            queryKey: fittingQueryKeys.currentJob,
          });
          void queryClient.invalidateQueries({
            queryKey: fittingQueryKeys.job(event.fittingJobId),
          });
          const fittingJobPath = `/fitting/jobs/${event.fittingJobId}`;
          const isCurrentFittingJobPage =
            pathnameRef.current === fittingJobPath ||
            pathnameRef.current === `${fittingJobPath}/result`;

          if (isCurrentFittingJobPage) continue;

          const message =
            event.type === "FITTING_SUCCESS"
              ? "가상 피팅이 완성되었어요."
              : "가상 피팅 생성에 실패했어요.";

          if (event.type === "FITTING_SUCCESS") {
            showToast.success(message, {
              duration: 5000,
              action: {
                label: "결과 보기",
                onClick: () => router.push(`${fittingJobPath}/result`),
              },
            });
          } else {
            showToast.error(message);
          }
        }
        console.warn("[notification-sse] response ended", {
          elapsedMs: Date.now() - startedAt,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          console.warn("[notification-sse] aborted", {
            elapsedMs: Date.now() - startedAt,
          });
          return;
        }

        console.error("[notification-sse] failed", error, {
          elapsedMs: Date.now() - startedAt,
        });
      }

      if (!stopped) {
        console.warn("[notification-sse] reconnect scheduled", {
          delayMs: RECONNECT_DELAY,
        });
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
      }
    }

    void connect();

    return () => {
      stopped = true;
      controller?.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [queryClient, router]);

  return (
    <NotificationUnreadContext value={unreadStatus?.hasUnread ?? false}>
      {children}
    </NotificationUnreadContext>
  );
}

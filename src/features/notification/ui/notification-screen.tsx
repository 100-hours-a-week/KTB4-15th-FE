"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { LoadingMessage } from "@/shared/ui/loading-message";
import { showToast } from "@/shared/ui/toast";
import {
  notificationListQueryOptions,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "../model/notification-query";
import { NotificationCard } from "./notification-card";
import styles from "./notification-screen.module.scss";

export function NotificationScreen() {
  const { data, isError, isFetching, isPending, refetch } = useQuery(
    notificationListQueryOptions,
  );
  const markReadMutation = useMarkNotificationAsReadMutation(() =>
    showToast.error("알림을 읽음 처리하지 못했어요."),
  );
  const markAllReadMutation = useMarkAllNotificationsAsReadMutation(() =>
    showToast.error("알림을 모두 읽음 처리하지 못했어요."),
  );

  return (
    <div className={styles.content}>
      {data && !isError && (
        <div className={styles.toolbar}>
          <span>읽지 않은 알림 {data.unreadCount}개</span>
          <Button
            disabled={data.unreadCount === 0}
            isLoading={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
            size="small"
            variant="text"
          >
            모두 읽음
          </Button>
        </div>
      )}
      {isPending && (
        <LoadingMessage className={styles.state}>
          알림을 불러오고 있어요
        </LoadingMessage>
      )}
      {isError && (
        <div className={styles.state} role="alert">
          <p>알림을 불러오지 못했어요.</p>
          <Button
            isLoading={isFetching}
            onClick={() => void refetch()}
            size="small"
            variant="secondary"
          >
            다시 시도
          </Button>
        </div>
      )}
      {!isPending && !isError && data.items.length === 0 && (
        <p className={styles.state}>아직 도착한 알림이 없어요.</p>
      )}
      {data && data.items.length > 0 && (
        <div className={styles.list}>
          {data.items.map((item) => (
            <NotificationCard
              item={item}
              key={item.notificationId}
              onRead={async () => {
                try {
                  await markReadMutation.mutateAsync(item.notificationId);
                  return true;
                } catch {
                  return false;
                }
              }}
            />
          ))}
        </div>
      )}
      {data && !isError && (
        <p className={styles.retentionNotice}>
          알림은 최근 7일 동안 보관되며 순차적으로 자동 삭제됩니다.
        </p>
      )}
    </div>
  );
}

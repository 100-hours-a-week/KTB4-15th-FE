import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getNotifications,
  getNotificationUnreadStatus,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notification";
import { markNotificationListAsRead } from "./notification-read";
import type {
  NotificationList,
  NotificationUnreadStatus,
} from "../schema/notification";

export const notificationQueryKeys = {
  list: ["notifications", "list"] as const,
  unread: ["notifications", "unread"] as const,
};

export const notificationListQueryOptions = queryOptions({
  queryKey: notificationQueryKeys.list,
  queryFn: getNotifications,
  staleTime: 0,
});

export const notificationUnreadQueryOptions = queryOptions({
  queryKey: notificationQueryKeys.unread,
  queryFn: getNotificationUnreadStatus,
});

function useUpdateReadState() {
  const queryClient = useQueryClient();

  return (unreadCount: number, notificationId?: number) => {
    queryClient.setQueryData<NotificationList>(
      notificationQueryKeys.list,
      (list) =>
        list && markNotificationListAsRead(list, unreadCount, notificationId),
    );
    queryClient.setQueryData<NotificationUnreadStatus>(
      notificationQueryKeys.unread,
      { hasUnread: unreadCount > 0 },
    );
  };
}

export function useMarkNotificationAsReadMutation(onError: () => void) {
  const updateReadState = useUpdateReadState();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onError,
    onSuccess: ({ unreadCount }, notificationId) =>
      updateReadState(unreadCount, notificationId),
  });
}

export function useMarkAllNotificationsAsReadMutation(onError: () => void) {
  const updateReadState = useUpdateReadState();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onError,
    onSuccess: ({ unreadCount }) => updateReadState(unreadCount),
  });
}

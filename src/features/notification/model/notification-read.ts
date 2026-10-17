import type { NotificationList } from "../schema/notification";

export function markNotificationListAsRead(
  list: NotificationList,
  unreadCount: number,
  notificationId?: number,
) {
  return {
    ...list,
    unreadCount,
    items: list.items.map((item) =>
      notificationId == null || item.notificationId === notificationId
        ? { ...item, isRead: true }
        : item,
    ),
  };
}

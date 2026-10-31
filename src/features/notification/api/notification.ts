import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import { extractSseEvents } from "@/shared/api/sse";
import {
  notificationConnectedEvent,
  notificationList,
  notificationRead,
  notificationReceivedEvent,
  notificationUnreadStatus,
  type NotificationStreamEvent,
} from "../schema/notification";

export async function getNotifications() {
  const response = await apiClient.get("notifications");

  return parseResponse(response, notificationList);
}

export async function getNotificationUnreadStatus() {
  const response = await apiClient.get("notifications/unread");

  return parseResponse(response, notificationUnreadStatus);
}

export async function markNotificationAsRead(notificationId: number) {
  const response = await apiClient.patch(
    `notifications/${notificationId}/read`,
    {
      json: { isRead: true },
    },
  );

  return parseResponse(response, notificationRead);
}

export async function markAllNotificationsAsRead() {
  const response = await apiClient.patch("notifications", {
    json: { isRead: true },
  });

  return parseResponse(response, notificationRead);
}

export async function* connectNotificationStream(
  signal: AbortSignal,
): AsyncGenerator<NotificationStreamEvent> {
  const response = await apiClient.get("notifications/stream", {
    headers: { Accept: "text/event-stream" },
    retry: 0,
    signal,
    timeout: false,
  });
  const reader = response.body?.getReader();

  if (reader == null) {
    throw new Error("알림 스트리밍 응답을 읽을 수 없습니다.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) return;

      buffer += decoder.decode(value, { stream: true });
      const parsed = extractSseEvents(buffer);
      buffer = parsed.rest;

      for (const event of parsed.events) {
        if (event.event === "connected") {
          const json: unknown = JSON.parse(event.data);
          const { data } = notificationConnectedEvent.parse(json);
          yield { event: "connected", ...data };
        } else if (event.event === "notification") {
          const json: unknown = JSON.parse(event.data);
          const { data } = notificationReceivedEvent.parse(json);
          yield { event: "notification", ...data };
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

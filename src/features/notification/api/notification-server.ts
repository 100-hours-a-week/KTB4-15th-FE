import "server-only";

import { serverApi } from "@/shared/api/server";
import { parseResponse } from "@/shared/api/response";
import { notificationUnreadStatus } from "../schema/notification";

export async function getNotificationUnreadStatusServer() {
  const response = await serverApi("notifications/unread", {
    cache: "no-store",
    signal: AbortSignal.timeout(1000),
  });

  return parseResponse(response, notificationUnreadStatus);
}

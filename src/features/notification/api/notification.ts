import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import { notificationList } from "../schema/notification";

export async function getNotifications() {
  const response = await apiClient.get("notifications");

  return parseResponse(response, notificationList);
}

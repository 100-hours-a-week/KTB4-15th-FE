import { queryOptions } from "@tanstack/react-query";
import { getNotifications } from "../api/notification";

export const notificationListQueryOptions = queryOptions({
  queryKey: ["notifications", "list"],
  queryFn: getNotifications,
  staleTime: 0,
});

"use client";

import { createContext, useContext } from "react";

export const NotificationUnreadContext = createContext(false);

export function useNotificationUnread() {
  return useContext(NotificationUnreadContext);
}

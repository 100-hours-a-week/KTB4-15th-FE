import { z } from "zod";

export const notificationType = z.enum(["FITTING_SUCCESS", "FITTING_FAIL"]);

const notificationBase = z.object({
  notificationId: z.number().int().positive(),
  isRead: z.boolean(),
  targetType: z.literal("FITTING_JOB"),
  targetId: z.number().int().positive(),
  createdAt: z.string(),
});

export const notificationItem = z.discriminatedUnion("type", [
  notificationBase.extend({
    type: z.literal("FITTING_SUCCESS"),
    payload: z.object({ outfitName: z.string() }),
  }),
  notificationBase.extend({
    type: z.literal("FITTING_FAIL"),
    payload: z.object({}),
  }),
]);

export const notificationList = z.object({
  items: z.array(notificationItem),
  unreadCount: z.number().int().nonnegative(),
});

export const notificationRead = z.object({
  unreadCount: z.number().int().nonnegative(),
});

export const notificationUnreadStatus = z.object({
  hasUnread: z.boolean(),
});

export type NotificationItem = z.infer<typeof notificationItem>;
export type NotificationList = z.infer<typeof notificationList>;
export type NotificationUnreadStatus = z.infer<typeof notificationUnreadStatus>;

const connectedData = z.object({
  unreadCount: z.number().int().nonnegative(),
  hasUnread: z.boolean(),
});

const notificationData = z.object({
  notificationId: z.number().int().positive(),
  fittingJobId: z.number().int().positive(),
  type: notificationType,
});

export const notificationConnectedEvent = z.object({
  code: z.literal("NOTIFICATION_STREAM_CONNECTED"),
  data: connectedData,
  message: z.string(),
});

export const notificationReceivedEvent = z.object({
  code: z.literal("NOTIFICATION_RECEIVED"),
  data: notificationData,
  message: z.string(),
});

export const notificationStreamEvent = z.discriminatedUnion("event", [
  connectedData.extend({ event: z.literal("connected") }),
  notificationData.extend({ event: z.literal("notification") }),
]);

export type NotificationType = z.infer<typeof notificationType>;
export type NotificationStreamEvent = z.infer<typeof notificationStreamEvent>;

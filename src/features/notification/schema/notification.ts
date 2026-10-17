import { z } from "zod";

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

export type NotificationItem = z.infer<typeof notificationItem>;

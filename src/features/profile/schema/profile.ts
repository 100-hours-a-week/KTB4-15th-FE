import { z } from "zod";

export const memberProfileSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  age: z.number().int(),
  height: z.number(),
  weight: z.number(),
  fullBodyImageKey: z.string(),
  priceAlertEnabled: z.boolean(),
});

export type MemberProfile = z.infer<typeof memberProfileSchema>;

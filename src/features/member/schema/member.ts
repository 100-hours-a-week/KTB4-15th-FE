import { z } from "zod";

export const memberMeSchema = z.object({
  profileCompleted: z.boolean(),
});

export type MemberMe = z.infer<typeof memberMeSchema>;

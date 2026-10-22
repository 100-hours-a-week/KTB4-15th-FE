import { z } from "zod";
import { NAME_PATTERN } from "@/shared/utils/profile-validation";

export const memberProfileSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  age: z.number().int().nullable(),
  height: z.number().nullable(),
  weight: z.number().nullable(),
  fullBodyImageUrl: z.string().url().nullable(),
  priceAlertEnabled: z.boolean(),
});

export type MemberProfile = z.infer<typeof memberProfileSchema>;

export const memberProfileCreateRequestSchema = z.object({
  name: z.string().trim().min(1).max(10).regex(NAME_PATTERN),
  age: z.number().int().min(1).max(100).optional(),
  height: z.number().min(100).max(250).optional(),
  weight: z.number().min(30).max(200).optional(),
  fullBodyImageValidationId: z.number().int().positive().optional(),
  priceAlertEnabled: z.boolean(),
});

export const memberProfileCreateResponseSchema = z.object({
  profileId: z.number().int().positive(),
});

export type MemberProfileCreateRequest = z.infer<
  typeof memberProfileCreateRequestSchema
>;

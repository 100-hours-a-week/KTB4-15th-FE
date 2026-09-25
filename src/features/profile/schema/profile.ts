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

export const fullBodyImageValidationSchema = z.object({
  validationId: z.number().int().positive(),
  fullBodyImageUrl: z.string().url(),
});

export const memberProfileCreateRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .regex(/^[가-힣A-Za-z ]+$/),
  age: z.number().int().min(1).max(100),
  height: z.number().min(100).max(250),
  weight: z.number().min(30).max(200),
  fullBodyImageValidationId: z.number().int().positive(),
  priceAlertEnabled: z.boolean(),
});

export const memberProfileCreateResponseSchema = z.object({
  profileId: z.number().int().positive(),
  fullBodyImageKey: z.string(),
});

export type MemberProfileCreateRequest = z.infer<
  typeof memberProfileCreateRequestSchema
>;

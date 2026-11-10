import * as z from "zod";
import { productItemTypeSchema } from "@/shared/schema/product";

export const FITTING_OUTFIT_NAME_MAX_LENGTH = 20;

export const fittingResultProductSchema = z.object({
  productId: z.number().int().positive(),
  itemType: productItemTypeSchema,
  productName: z.string(),
  productImageUrl: z.string(),
  purchaseUrl: z.string(),
});

export const fittingOutfitNameSchema = z
  .string()
  .min(1)
  .max(FITTING_OUTFIT_NAME_MAX_LENGTH)
  .refine((value) => value.trim().length > 0);

export const fittingResultCreateRequestSchema = z.object({
  fittingJobId: z.number().int().positive(),
  outfitName: fittingOutfitNameSchema,
});

export const fittingResultCreateResponseSchema = z.object({
  fittingResultId: z.number().int().positive(),
  outfitName: z.string(),
});

export const fittingResultListItemSchema = z.object({
  fittingResultId: z.number().int().positive(),
  resultImageUrl: z.string(),
  outfitName: z.string(),
  savedAt: z.string(),
});

export const fittingResultListResponseSchema = z.object({
  items: z.array(fittingResultListItemSchema),
  totalCount: z.number().int().nonnegative(),
  nextCursor: z.number().int().positive().nullable(),
  hasNext: z.boolean(),
});

export const fittingResultDetailResponseSchema = z.object({
  fittingResultId: z.number().int().positive(),
  resultImageUrl: z.string(),
  outfitName: z.string(),
  comment: z.string(),
  products: z.array(fittingResultProductSchema),
});

export const fittingResultOutfitNameUpdateRequestSchema = z.object({
  outfitName: fittingOutfitNameSchema,
});

export const fittingResultOutfitNameUpdateResponseSchema = z.object({
  fittingResultId: z.number().int().positive(),
  outfitName: z.string(),
});

export type FittingResultCreateRequest = z.infer<
  typeof fittingResultCreateRequestSchema
>;
export type FittingResultDetail = z.infer<
  typeof fittingResultDetailResponseSchema
>;
export type FittingResultListItem = z.infer<typeof fittingResultListItemSchema>;
export type FittingResultOutfitNameUpdateRequest = z.infer<
  typeof fittingResultOutfitNameUpdateRequestSchema
>;

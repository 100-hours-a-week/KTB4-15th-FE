import { z } from "zod";

export const fittingCandidateCreateResponse = z.object({
  fittingCandidateId: z.number().int().positive(),
  productId: z.number().int().positive(),
});

export const fittingCandidateSchema = z.object({
  fittingCandidateId: z.number().int().positive(),
  productId: z.number().int().positive(),
  productName: z.string(),
  productImageUrl: z.string(),
  currentPrice: z.number().int().nonnegative(),
  color: z.string(),
  itemType: z.enum(["TOP", "BOTTOM"]),
});

export const fittingCandidateListResponse = z.object({
  items: z.array(fittingCandidateSchema),
  nextCursor: z.number().int().positive().nullable(),
  hasNext: z.boolean(),
});

export type FittingCandidateCreateResponse = z.infer<
  typeof fittingCandidateCreateResponse
>;

export type FittingCandidate = z.infer<typeof fittingCandidateSchema>;
export type FittingCandidateListResponse = z.infer<
  typeof fittingCandidateListResponse
>;

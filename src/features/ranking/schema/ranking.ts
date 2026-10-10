import { z } from "zod";

export const rankingTypeSchema = z.enum(["WISH", "CLICK"]);

export const rankingItemSchema = z.object({
  rank: z.number().int().positive().optional(),
  productId: z.number().int().positive(),
  productName: z.string(),
  productImageUrl: z.string(),
  currentPrice: z.number().int().nonnegative(),
  purchaseUrl: z.string(),
  color: z.string().nullable(),
  rankingCount: z.number().int().nonnegative(),
});

export const productRankingSchema = z.object({
  type: rankingTypeSchema,
  items: z.array(rankingItemSchema).max(100),
});

export type RankingType = z.infer<typeof rankingTypeSchema>;
export type RankingItem = z.infer<typeof rankingItemSchema>;
export type ProductRanking = z.infer<typeof productRankingSchema>;

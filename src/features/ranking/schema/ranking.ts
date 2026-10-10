import { z } from "zod";
import { productItemTypeSchema } from "@/shared/schema/product";

export const rankingTypeSchema = z.enum(["WISH", "CLICK"]);

export const rankingProductSchema = z.object({
  rank: z.number().int().positive(),
  productId: z.number().int().positive(),
  productName: z.string(),
  productImageUrl: z.string(),
  itemType: productItemTypeSchema,
  currentPrice: z.number().int().nonnegative(),
  purchaseUrl: z.string(),
  color: z.string().nullable(),
  rankingCount: z.number().int().nonnegative(),
});

export const productRankingSchema = z.object({
  type: rankingTypeSchema,
  items: z.array(rankingProductSchema).max(100),
});

export type RankingType = z.infer<typeof rankingTypeSchema>;
export type RankingProduct = z.infer<typeof rankingProductSchema>;
export type ProductRanking = z.infer<typeof productRankingSchema>;

import * as z from "zod";
import { productItemTypeSchema } from "@/shared/schema/product";

export const wishlistCreateResponse = z.object({
  wishlistId: z.number().int().positive(),
  productId: z.number().int().positive(),
});

export const wishlistCountResponse = z.object({
  count: z.number().int().nonnegative(),
});

export const wishlistItemSchema = z.object({
  wishlistId: z.number().int().positive(),
  productId: z.number().int().positive(),
  productName: z.string(),
  productImageUrl: z.string(),
  itemType: productItemTypeSchema,
  wishedPrice: z.number().int().nonnegative(),
  currentPrice: z.number().int().nonnegative(),
  priceChangeRate: z.number().int(),
  purchaseUrl: z.string(),
  wishedAt: z.string(),
});

export const wishlistListResponse = z.object({
  totalCount: z.number().int().nonnegative(),
  items: z.array(wishlistItemSchema),
  nextCursor: z.number().int().positive().nullable(),
  hasNext: z.boolean(),
});

export type WishlistItem = z.infer<typeof wishlistItemSchema>;
export type WishlistList = z.infer<typeof wishlistListResponse>;

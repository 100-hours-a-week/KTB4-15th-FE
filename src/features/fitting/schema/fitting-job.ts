import * as z from "zod";
import { productItemTypeSchema } from "@/shared/schema/product";
import { fittingResultProductSchema } from "./fitting-result";

export const fittingJobCreateRequestSchema = z
  .object({
    topProductId: z.number().int().positive().optional(),
    bottomProductId: z.number().int().positive().optional(),
  })
  .refine(
    ({ topProductId, bottomProductId }) =>
      topProductId !== undefined || bottomProductId !== undefined,
    { message: "상의 또는 하의 상품이 필요합니다." },
  );

export const fittingJobCreateResponseSchema = z.object({
  fittingJobId: z.number().int().positive(),
  status: z.literal("GENERATING"),
});

export const fittingJobStatusResponseSchema = z.object({
  fittingJobId: z.number().int().positive(),
  status: z.enum(["GENERATING", "COMPLETED", "FAILED"]),
  createdAt: z.string(),
});

export const fittingResultViewedResponseSchema = z.object({
  fittingJobId: z.number().int().positive(),
});

export const currentFittingJobResponseSchema = z
  .object({
    fittingJobId: z.number().int().positive(),
    status: z.enum(["GENERATING", "COMPLETED", "FAILED"]),
    createdAt: z.string(),
    resultViewed: z.boolean(),
    products: z.array(
      z.object({
        productId: z.number().int().positive(),
        itemType: productItemTypeSchema,
        productName: z.string(),
        productImageUrl: z.string(),
      }),
    ),
  })
  .nullable();

export const fittingTempResultResponseSchema = z.object({
  fittingJobId: z.number().int().positive(),
  resultViewed: z.boolean(),
  saved: z.boolean(),
  fittingResultId: z.number().int().positive().nullable(),
  resultImageUrl: z.string(),
  outfitName: z.string(),
  comment: z.string().nullable(),
  products: z.array(
    fittingResultProductSchema.extend({ purchaseUrl: z.string().nullable() }),
  ),
});

export type FittingJobCreateRequest = z.infer<
  typeof fittingJobCreateRequestSchema
>;
export type FittingTempResult = z.infer<typeof fittingTempResultResponseSchema>;

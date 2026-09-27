import { z } from "zod";

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

const fittingResultProductSchema = z.object({
  productId: z.number().int().positive(),
  itemType: z.enum(["TOP", "BOTTOM"]),
  productName: z.string(),
  productImageUrl: z.string(),
  purchaseUrl: z.string(),
});

const fittingResultSchema = z.object({
  resultImageUrl: z.string(),
  outfitName: z.string(),
  comment: z.string(),
  products: z.array(fittingResultProductSchema),
});

export const fittingJobStatusResponseSchema = z.object({
  fittingJobId: z.number().int().positive(),
  status: z.enum(["GENERATING", "COMPLETED", "FAILED"]),
  result: fittingResultSchema.nullable(),
});

export type FittingJobCreateRequest = z.infer<
  typeof fittingJobCreateRequestSchema
>;
export type FittingJobStatusResponse = z.infer<
  typeof fittingJobStatusResponseSchema
>;

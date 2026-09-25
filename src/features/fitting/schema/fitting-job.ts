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

export type FittingJobCreateRequest = z.infer<
  typeof fittingJobCreateRequestSchema
>;

import { z } from "zod";

export const fittingCandidateCreateResponse = z.object({
  fittingCandidateId: z.number().int().positive(),
  productId: z.number().int().positive(),
});

export type FittingCandidateCreateResponse = z.infer<
  typeof fittingCandidateCreateResponse
>;

import { z } from "zod";

export const FITTING_CANDIDATE_LIMIT = 300;

export const fittingCandidateCreateResponse = z.object({
  fittingCandidateId: z.number().int().positive(),
  productId: z.number().int().positive(),
});

export type FittingCandidateCreateResponse = z.infer<
  typeof fittingCandidateCreateResponse
>;

export const fittingCandidateCountResponse = z.object({
  totalCount: z.number().int().nonnegative(),
});

export type FittingCandidateCountResponse = z.infer<
  typeof fittingCandidateCountResponse
>;

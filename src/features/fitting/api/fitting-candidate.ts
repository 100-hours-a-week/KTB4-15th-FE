import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
  FITTING_CANDIDATE_LIMIT,
  fittingCandidateCountResponse,
  fittingCandidateCreateResponse,
} from "../schema/fitting-candidate";

export class FittingCandidateLimitError extends Error {
  constructor() {
    super(
      `피팅 상품은 최대 ${FITTING_CANDIDATE_LIMIT}개까지 추가할 수 있어요.`,
    );
    this.name = "FittingCandidateLimitError";
  }
}

export async function getFittingCandidateCount() {
  const response = await apiClient.get("fitting-candidates", {
    searchParams: { size: 1 },
  });

  return parseResponse(response, fittingCandidateCountResponse);
}

export async function createFittingCandidate(productId: number) {
  const { totalCount } = await getFittingCandidateCount();

  if (totalCount >= FITTING_CANDIDATE_LIMIT) {
    throw new FittingCandidateLimitError();
  }

  const response = await apiClient.post("fitting-candidates", {
    json: { productId },
  });

  return parseResponse(response, fittingCandidateCreateResponse);
}

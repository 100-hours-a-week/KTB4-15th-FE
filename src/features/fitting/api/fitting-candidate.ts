import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
  FITTING_CANDIDATE_LIMIT,
  fittingCandidateBulkDeleteResponse,
  fittingCandidateCountResponse,
  fittingCandidateCreateResponse,
  fittingCandidateListResponse,
} from "../schema/fitting-candidate";

export type FittingCandidateItemType = "TOP" | "BOTTOM";

type GetFittingCandidatesParams = {
  cursor?: number;
  itemType?: FittingCandidateItemType;
  size: number;
};

export async function getFittingCandidates({
  cursor,
  itemType,
  size,
}: GetFittingCandidatesParams) {
  const searchParams = new URLSearchParams();

  if (itemType) searchParams.set("itemType", itemType);
  if (cursor) {
    searchParams.set("cursor", String(cursor));
  }
  searchParams.set("size", String(size));

  const response = await apiClient.get("fitting-candidates", {
    searchParams,
  });

  return parseResponse(response, fittingCandidateListResponse);
}

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

export async function deleteFittingCandidates(fittingCandidateIds: number[]) {
  const response = await apiClient.delete("fitting-candidates", {
    json: { fittingCandidateIds },
  });

  return parseResponse(response, fittingCandidateBulkDeleteResponse);
}

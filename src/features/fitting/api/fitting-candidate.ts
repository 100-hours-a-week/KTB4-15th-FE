import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import type { ProductItemType } from "@/shared/schema/product";
import {
  fittingCandidateBulkDeleteResponse,
  fittingCandidateCreateResponse,
  fittingCandidateListResponse,
} from "../schema/fitting-candidate";

type GetFittingCandidatesParams = {
  cursor?: number;
  itemType?: ProductItemType;
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

export async function createFittingCandidate(productId: number) {
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

import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
  type FittingResultCreateRequest,
  fittingResultCreateResponseSchema,
  fittingResultDetailResponseSchema,
  fittingResultListResponseSchema,
  type FittingResultOutfitNameUpdateRequest,
  fittingResultOutfitNameUpdateResponseSchema,
} from "../schema/fitting-result";

type GetFittingResultsParams = {
  cursor?: number;
  size?: number;
};

export async function getFittingResults({
  cursor,
  size = 20,
}: GetFittingResultsParams = {}) {
  const searchParams = new URLSearchParams({ size: String(size) });
  if (cursor) searchParams.set("cursor", String(cursor));

  const response = await apiClient.get("fitting-results", { searchParams });

  return parseResponse(response, fittingResultListResponseSchema);
}

export async function getFittingResult(fittingResultId: number) {
  const response = await apiClient.get(`fitting-results/${fittingResultId}`);

  return parseResponse(response, fittingResultDetailResponseSchema);
}

export async function createFittingResult(request: FittingResultCreateRequest) {
  const response = await apiClient.post("fitting-results", { json: request });

  return parseResponse(response, fittingResultCreateResponseSchema);
}

export async function updateFittingResultOutfitName({
  fittingResultId,
  request,
}: {
  fittingResultId: number;
  request: FittingResultOutfitNameUpdateRequest;
}) {
  const response = await apiClient.patch(`fitting-results/${fittingResultId}`, {
    json: request,
  });

  return parseResponse(response, fittingResultOutfitNameUpdateResponseSchema);
}

export async function deleteFittingResult(fittingResultId: number) {
  await apiClient.delete(`fitting-results/${fittingResultId}`);
}

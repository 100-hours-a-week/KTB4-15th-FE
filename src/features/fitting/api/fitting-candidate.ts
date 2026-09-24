import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import { fittingCandidateCreateResponse } from "../schema/fitting-candidate";

export async function createFittingCandidate(productId: number) {
  const response = await apiClient.post("fitting-candidates", {
    json: { productId },
  });

  return parseResponse(response, fittingCandidateCreateResponse);
}

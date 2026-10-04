import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
  type FittingJobCreateRequest,
  fittingJobCreateResponseSchema,
  fittingJobStatusResponseSchema,
} from "../schema/fitting-job";

export async function createFittingJob(request: FittingJobCreateRequest) {
  const response = await apiClient.post("fitting-jobs", {
    json: request,
  });

  return parseResponse(response, fittingJobCreateResponseSchema);
}

export async function getFittingJobStatus(fittingJobId: number) {
  const response = await apiClient.get(`fitting-jobs/${fittingJobId}`);

  return parseResponse(response, fittingJobStatusResponseSchema);
}

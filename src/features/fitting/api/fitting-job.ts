import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
  type FittingJobCreateRequest,
  currentFittingJobResponseSchema,
  fittingJobCreateResponseSchema,
  fittingJobStatusResponseSchema,
  fittingResultViewedResponseSchema,
  fittingTempResultResponseSchema,
} from "../schema/fitting-job";

export async function getCurrentFittingJob() {
  const response = await apiClient.get("fitting-jobs/current");

  return parseResponse(response, currentFittingJobResponseSchema);
}

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

export async function getFittingTempResult(fittingJobId: number) {
  const response = await apiClient.get(`fitting-jobs/${fittingJobId}/result`);

  return parseResponse(response, fittingTempResultResponseSchema);
}

export async function markFittingResultViewed(fittingJobId: number) {
  const response = await apiClient.patch(
    `fitting-jobs/${fittingJobId}/result/viewed`,
  );

  return parseResponse(response, fittingResultViewedResponseSchema);
}

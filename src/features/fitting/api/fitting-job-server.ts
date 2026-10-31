import "server-only";

import { parseResponse } from "@/shared/api/response";
import { serverApi } from "@/shared/api/server";
import { currentFittingJobResponseSchema } from "../schema/fitting-job";

export async function getCurrentFittingJobServer() {
  const response = await serverApi("fitting-jobs/current", {
    cache: "no-store",
  });

  return parseResponse(response, currentFittingJobResponseSchema);
}

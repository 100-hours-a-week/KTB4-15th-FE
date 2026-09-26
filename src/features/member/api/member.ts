import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import { memberMeSchema } from "../schema/member";

export async function getMemberMe() {
  const response = await apiClient.get("members/me");

  return parseResponse(response, memberMeSchema);
}

import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import { memberProfileSchema } from "../schema/profile";

export async function getMemberProfile() {
  const response = await apiClient.get("members/me/profile");

  return parseResponse(response, memberProfileSchema);
}

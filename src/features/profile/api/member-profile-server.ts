import "server-only";

import { serverApi } from "@/shared/api/server";
import { parseResponse } from "@/shared/api/response";
import { memberProfileSchema } from "../schema/member-profile";

export async function getMemberProfileServer() {
  const response = await serverApi("members/me/profile");

  return parseResponse(response, memberProfileSchema);
}

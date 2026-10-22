import "server-only";

import { serverApi } from "@/shared/api/server";
import { parseResponse } from "@/shared/api/response";
import { memberMeSchema } from "../schema/member";

export async function getMemberMeServer() {
  const response = await serverApi("members/me");

  return parseResponse(response, memberMeSchema);
}

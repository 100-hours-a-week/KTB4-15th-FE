import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import { signupResponse, type SignupRequest } from "../schema/auth";

export async function signup(payload: SignupRequest) {
  const response = await apiClient.post("auth/signup", {
    json: payload,
  });

  return parseResponse(response, signupResponse);
}

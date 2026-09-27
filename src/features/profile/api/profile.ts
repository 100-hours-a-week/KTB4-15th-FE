import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
  fullBodyImageValidationSchema,
  memberProfileCreateRequestSchema,
  memberProfileCreateResponseSchema,
  memberProfileSchema,
  type MemberProfileCreateRequest,
} from "../schema/profile";

export async function getMemberProfile() {
  const response = await apiClient.get("members/me/profile");

  return parseResponse(response, memberProfileSchema);
}

export async function createMemberProfile(payload: MemberProfileCreateRequest) {
  const body = memberProfileCreateRequestSchema.parse(payload);
  const response = await apiClient.post("members/me/profile", {
    json: body,
  });

  return parseResponse(response, memberProfileCreateResponseSchema);
}

export async function validateFullBodyImage(image: File) {
  const formData = new FormData();
  formData.append("image", image);

  const response = await apiClient.post("full-body-image/validate", {
    body: formData,
  });

  return parseResponse(response, fullBodyImageValidationSchema);
}

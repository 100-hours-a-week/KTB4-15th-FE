import { getPhotoValidationMessage } from "@/features/full-body-image";
import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import { z } from "zod";
import {
  fullBodyImageValidationSchema,
  memberProfileCreateRequestSchema,
  memberProfileCreateResponseSchema,
  memberProfileSchema,
  type MemberProfileCreateRequest,
} from "../schema/profile";

const FULL_BODY_IMAGE_VALIDATION_TIMEOUT_MS = 60_000;

const fullBodyImageValidationResponseSchema = z.object({
  code: z.string(),
  data: fullBodyImageValidationSchema.nullable(),
  message: z.string(),
});

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
    timeout: FULL_BODY_IMAGE_VALIDATION_TIMEOUT_MS,
    throwHttpErrors: false,
  });

  const result = fullBodyImageValidationResponseSchema.parse(
    await response.json(),
  );

  if (result.data === null) {
    return {
      message: getPhotoValidationMessage(result.code, result.message),
      success: false,
    } as const;
  }

  return { data: result.data, success: true } as const;
}

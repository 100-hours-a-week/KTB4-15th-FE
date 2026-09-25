import { HTTPError } from "ky";
import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
  fullBodyImageValidationSchema,
  memberProfileCreateRequestSchema,
  memberProfileCreateResponseSchema,
  memberProfileSchema,
  type MemberProfileCreateRequest,
} from "../schema/profile";

const MEMBER_PROFILE_NOT_FOUND = "MEMBER_PROFILE_NOT_FOUND";

export class MemberProfileNotFoundError extends Error {
  constructor() {
    super("회원 기본정보를 찾을 수 없습니다.");
    this.name = "MemberProfileNotFoundError";
  }
}

async function isMemberProfileNotFound(error: unknown) {
  if (!(error instanceof HTTPError) || error.response.status !== 404) {
    return false;
  }

  const body: unknown = await error.response
    .clone()
    .json()
    .catch(() => null);

  return (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    body.code === MEMBER_PROFILE_NOT_FOUND
  );
}

export async function getMemberProfile() {
  try {
    const response = await apiClient.get("members/me/profile");

    return parseResponse(response, memberProfileSchema);
  } catch (error) {
    if (await isMemberProfileNotFound(error)) {
      throw new MemberProfileNotFoundError();
    }

    throw error;
  }
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

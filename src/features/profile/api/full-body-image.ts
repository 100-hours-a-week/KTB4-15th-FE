import { z } from "zod";
import { apiClient } from "@/shared/api/client";
import { getPhotoValidationMessage } from "../lib/full-body-image-validation";
import { fullBodyImageValidationSchema } from "../schema/full-body-image";

const FULL_BODY_IMAGE_VALIDATION_TIMEOUT_MS = 2 * 60 * 1000;

const fullBodyImageValidationResponseSchema = z.object({
  code: z.string(),
  data: fullBodyImageValidationSchema.nullable(),
  message: z.string(),
});

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
      isValid: false,
      message: getPhotoValidationMessage(result.code),
    } as const;
  }

  return { data: result.data, isValid: true } as const;
}

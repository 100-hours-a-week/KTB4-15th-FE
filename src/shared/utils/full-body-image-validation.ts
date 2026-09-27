const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const SUPPORTED_PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);
const SUPPORTED_PHOTO_TYPES = new Set(["image/jpeg", "image/png"]);

const PHOTO_INPUT_ERROR_MESSAGES: Record<string, string> = {
  IMAGE_EMPTY: "사진 파일을 등록해 주세요.",
  IMAGE_FORMAT_UNSUPPORTED: "파일은 JPG, JPEG, PNG만 가능합니다.",
  IMAGE_DECODE_FAILED: "사진 파일을 읽을 수 없어요. 다른 사진을 등록해 주세요.",
  IMAGE_RESOLUTION_TOO_SMALL:
    "사진의 해상도가 너무 낮아요. 더 선명한 사진을 등록해 주세요.",
  IMAGE_SIZE_EXCEEDED: "파일은 10MB까지만 가능합니다.",
  IMAGE_TOO_LARGE: "파일은 10MB까지만 가능합니다.",
  IMAGE_TOO_DARK: "사진이 너무 어두워요. 밝은 곳에서 다시 촬영해 주세요.",
  PERSON_NOT_FOUND: "사진에서 사람을 찾을 수 없어요.",
  MULTIPLE_PERSONS: "한 명만 나온 사진을 등록해 주세요.",
  PERSON_TOO_SMALL: "전신이 더 크게 보이도록 촬영해주세요.",
  FULL_BODY_NOT_VISIBLE: "머리부터 발끝까지 모두 나오도록 전신을 촬영해주세요.",
  ARMS_NOT_VISIBLE: "양팔이 모두 보이도록 촬영해주세요.",
  LEGS_NOT_VISIBLE: "양다리가 모두 보이도록 촬영해주세요.",
  NOT_FRONTAL: "카메라를 정면으로 바라보고 촬영해주세요.",
};

const PHOTO_SYSTEM_ERROR_MESSAGES: Record<string, string> = {
  BODY_IMAGE_AI_SERVER_UNAVAILABLE:
    "전신사진 검증 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
  BODY_IMAGE_VALIDATION_TIMEOUT:
    "전신사진 검증 시간이 초과되었습니다. 다시 시도해주세요.",
  BODY_IMAGE_VALIDATION_SYSTEM_ERROR:
    "전신사진 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

export function getLocalPhotoErrorMessage(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const hasSupportedExtension = SUPPORTED_PHOTO_EXTENSIONS.has(extension);
  const hasSupportedType =
    file.type === "" || SUPPORTED_PHOTO_TYPES.has(file.type);

  if (!hasSupportedExtension || !hasSupportedType) {
    return PHOTO_INPUT_ERROR_MESSAGES.IMAGE_FORMAT_UNSUPPORTED;
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return PHOTO_INPUT_ERROR_MESSAGES.IMAGE_TOO_LARGE;
  }

  return undefined;
}

export function getPhotoValidationMessage(
  code: string,
  message: string,
): string {
  const inputMessage = PHOTO_INPUT_ERROR_MESSAGES[code];
  if (inputMessage) return inputMessage;

  const systemMessage = PHOTO_SYSTEM_ERROR_MESSAGES[code];
  if (systemMessage) return systemMessage;

  return message;
}

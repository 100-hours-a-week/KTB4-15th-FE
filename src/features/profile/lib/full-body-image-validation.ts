const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const SUPPORTED_PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);
const SUPPORTED_PHOTO_TYPES = new Set(["image/jpeg", "image/png"]);

const PHOTO_INPUT_ERROR_MESSAGES: Record<string, string> = {
  INVALID_REQUEST: "사진 등록 요청이 올바르지 않아요. 다시 시도해 주세요.",
  IMAGE_EMPTY: "이미지 파일을 첨부해 주세요.",
  INVALID_IMAGE: "정상적인 이미지 파일을 등록해 주세요.",
  IMAGE_FORMAT_UNSUPPORTED: "JPG, JPEG 또는 PNG 이미지만 등록해 주세요.",
  IMAGE_DECODE_FAILED:
    "이미지 파일을 읽을 수 없어요. 다른 이미지를 선택해 주세요.",
  IMAGE_TOO_LARGE: "이미지 크기는 10MB 이하여야 합니다.",
  IMAGE_RESOLUTION_TOO_LARGE:
    "이미지 해상도가 너무 높아요. 더 작은 이미지를 등록해 주세요.",
  IMAGE_RESOLUTION_TOO_SMALL: "짧은 변이 480px 이상인 이미지를 등록해 주세요.",
  PERSON_NOT_FOUND: "사진에서 사람을 찾을 수 없어요.",
  MULTIPLE_PERSONS: "한 명만 나온 사진을 등록해 주세요.",
  PERSON_TOO_SMALL: "전신이 더 크게 보이도록 촬영해 주세요.",
  FULL_BODY_NOT_VISIBLE:
    "머리부터 발끝까지 모두 나오도록 전신을 촬영해 주세요.",
  ARMS_NOT_VISIBLE: "양팔이 모두 보이도록 촬영해 주세요.",
  LEGS_NOT_VISIBLE: "양다리가 모두 보이도록 촬영해 주세요.",
  NOT_FRONTAL: "카메라를 정면으로 바라보고 촬영해 주세요.",
  IMAGE_TOO_DARK: "사진이 너무 어두워요. 밝은 곳에서 다시 촬영해 주세요.",
  IMAGE_SIZE_EXCEEDED: "이미지 크기는 10MB 이하여야 합니다.",
};

const PHOTO_SYSTEM_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED:
    "사진 검증 요청을 인증하지 못했어요. 잠시 후 다시 시도해 주세요.",
  SERVER_BUSY:
    "지금 사진 확인 요청이 몰리고 있어요. 잠시 후 다시 시도해 주세요.",
  PERSON_DETECTION_FAILED:
    "사진 속 인물을 확인하는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  POSE_ESTIMATION_FAILED:
    "사진 속 자세를 확인하는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  BRIGHTNESS_CHECK_FAILED:
    "사진의 밝기를 확인하는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  BACKGROUND_REMOVAL_FAILED:
    "사진의 배경을 처리하는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  IMAGE_ENCODING_FAILED:
    "사진을 처리하는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  IMAGE_UPLOAD_FAILED:
    "처리된 사진을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
  S3_CONFIG_ERROR:
    "사진 저장소에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.",
  BODY_IMAGE_RUNTIME_UNAVAILABLE:
    "사진 검증 기능을 사용할 수 없어요. 잠시 후 다시 시도해 주세요.",
  INTERNAL_SERVER_ERROR:
    "사진 검증 중 서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",

  // BE에서 변환해 반환하는 기존 시스템 오류 코드입니다.
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

export function getPhotoValidationMessage(code: string): string {
  const inputMessage = PHOTO_INPUT_ERROR_MESSAGES[code];
  if (inputMessage) return inputMessage;

  const systemMessage = PHOTO_SYSTEM_ERROR_MESSAGES[code];
  if (systemMessage) return systemMessage;

  return "사진을 검증하지 못했어요. 다른 사진으로 다시 시도해 주세요.";
}

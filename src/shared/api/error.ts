import { HTTPError, NetworkError, TimeoutError } from "ky";

export class OfflineError extends Error {
  constructor() {
    super("인터넷 연결을 확인해 주세요.");
    this.name = "OfflineError";
  }
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function normalizeApiError(error: Error) {
  if (!(error instanceof HTTPError)) return error;

  const data = error.data;

  if (
    typeof data !== "object" ||
    data === null ||
    !("code" in data) ||
    typeof data.code !== "string"
  ) {
    return error;
  }

  return new ApiError(data.code, error.response.status);
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof OfflineError) return error.message;
  if (error instanceof NetworkError) {
    return "서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.";
  }
  if (error instanceof TimeoutError) {
    return "응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.";
  }

  return fallbackMessage;
}

import { HTTPError } from "ky";

export class OfflineError extends Error {
  constructor() {
    super("인터넷 연결을 확인해 주세요.");
    this.name = "OfflineError";
  }
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
    this.name = "ApiError";
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
  return error instanceof OfflineError ? error.message : fallbackMessage;
}

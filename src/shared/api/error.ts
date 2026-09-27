import { OfflineError } from "./client";

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof OfflineError ? error.message : fallbackMessage;
}

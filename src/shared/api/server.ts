import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE_URL = process.env.API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not defined");
}

export class ServerApiError extends Error {
  constructor(public readonly status: number) {
    super(`API request failed: ${status}`);
    this.name = "ServerApiError";
  }
}

export function isServerUnauthorizedError(error: unknown) {
  return error instanceof ServerApiError && error.status === 401;
}

export async function redirectOnServerUnauthorized(
  error: unknown,
): Promise<never> {
  if (!isServerUnauthorizedError(error)) throw error;

  const requestHeaders = await headers();
  if (requestHeaders.get("x-lookddak-refresh-attempted") === "1") {
    redirect("/login?reason=session-expired");
  }

  const returnTo = requestHeaders.get("x-lookddak-request-path") ?? "/chat";
  redirect(`/bff/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`);
}

export async function serverApi(path: string, init: RequestInit = {}) {
  const cookieStore = await cookies();

  const response = await fetch(new URL(path, API_BASE_URL), {
    ...init,
    headers: {
      ...init.headers,
      Cookie: cookieStore.toString(),
    },
    signal: init.signal ?? AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new ServerApiError(response.status);
  }

  return response;
}

import ky, { HTTPError } from "ky";

const apiOptions = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  credentials: "include" as const,
  timeout: 10000,
};

const refreshClient = ky.create(apiOptions);
const refreshExcludedPaths = ["/auth/login", "/auth/signup", "/auth/refresh"];

let refreshPromise: Promise<void> | undefined;

function refreshAccessToken() {
  refreshPromise ??= refreshClient
    .post("auth/refresh")
    .then(() => undefined)
    .finally(() => {
      refreshPromise = undefined;
    });

  return refreshPromise;
}

export const apiClient = ky.create({
  ...apiOptions,
  retry: {
    limit: 1,
  },
  hooks: {
    afterResponse: [
      async ({ request, response, retryCount }) => {
        const { pathname } = new URL(request.url);
        const isRefreshExcluded = refreshExcludedPaths.some((path) =>
          pathname.endsWith(path),
        );

        if (response.status !== 401 || retryCount > 0 || isRefreshExcluded) {
          return;
        }

        try {
          await refreshAccessToken();
        } catch (error) {
          if (error instanceof HTTPError && error.response.status === 401) {
            notifyRefreshUnauthorized();
            throw new RefreshUnauthorizedError();
          }

          throw error;
        }

        return ky.retry({
          code: "TOKEN_REFRESHED",
        });
      },
    ],
  },
});

export class RefreshUnauthorizedError extends Error {
  constructor() {
    super("인증 갱신에 실패했습니다.");
    this.name = "RefreshUnauthorizedError";
  }
}

type RefreshUnauthorizedListener = () => void;

const refreshUnauthorizedListeners = new Set<RefreshUnauthorizedListener>();

export function subscribeToRefreshUnauthorized(
  listener: RefreshUnauthorizedListener,
) {
  refreshUnauthorizedListeners.add(listener);

  return () => {
    refreshUnauthorizedListeners.delete(listener);
  };
}

function notifyRefreshUnauthorized() {
  refreshUnauthorizedListeners.forEach((listener) => listener());
}
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");

    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_API_MOCKING === "enabled"
    ) {
      const { server } = await import("./mocks/node");

      server.listen({ onUnhandledFrame: "warn" });
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

import * as Sentry from "@sentry/nextjs";
import { sentryDataCollection } from "@/shared/monitoring/sentry-config";
import { worker } from "./mocks/browser";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  dataCollection: sentryDataCollection,
  enabled: process.env.NODE_ENV === "production" && Boolean(dsn),
  environment: process.env.NODE_ENV,
});

if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_API_MOCKING === "enabled"
) {
  void worker.start({ onUnhandledFrame: "warn" }).catch((error: unknown) => {
    console.error("[MSW] 브라우저 모킹을 시작하지 못했습니다.", error);
  });
}

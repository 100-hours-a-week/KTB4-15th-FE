import * as Sentry from "@sentry/nextjs";
import { sentryDataCollection } from "@/shared/monitoring/sentry-config";

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
  // shortcut: 개발 MSW는 비동기로 시작된다, 초기 요청이 앞서면 동기식 개발 전용 진입점으로 옮긴다.
  void import("./mocks/browser")
    .then(({ worker }) => worker.start({ onUnhandledFrame: "warn" }))
    .catch((error: unknown) => {
      console.error("[MSW] 브라우저 모킹을 시작하지 못했습니다.", error);
    });
}

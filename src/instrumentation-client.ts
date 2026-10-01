import * as Sentry from "@sentry/nextjs";
import { sentryDataCollection } from "@/shared/monitoring/sentry-config";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  dataCollection: sentryDataCollection,
  enabled: process.env.NODE_ENV === "production" && Boolean(dsn),
  environment: process.env.NODE_ENV,
});

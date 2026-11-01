import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      { source: "/landing", destination: "/", permanent: true },
      { source: "/onboarding", destination: "/", permanent: true },
    ];
  },
  images: {
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "lookddak-dev-images-686496667254-ap-northeast-2.s3.ap-northeast-2.amazonaws.com",
        pathname: "/body-images/**",
        // Presigned URL마다 서명이 달라 search는 고정하지 않습니다.
      },
      {
        hostname: "img.29cm.co.kr",
        protocol: "https",
      },
    ],
  },
  output: "standalone",
};

const hasSentrySourceMapCredentials = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT,
);

export default withSentryConfig(nextConfig, {
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
  },
  silent: !process.env.CI,
  sourcemaps: {
    disable: !hasSentrySourceMapCredentials,
  },
  suppressOnRouterTransitionStartWarning: true,
});

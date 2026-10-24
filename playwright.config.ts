import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // 로컬 API의 저장 상태를 테스트마다 초기화하므로 순차 실행한다.
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node tests/e2e/fixtures/api-server.mts",
      url: "http://127.0.0.1:3101/health",
      reuseExistingServer: false,
    },
    {
      command: "pnpm dev --hostname 127.0.0.1 --port 3100",
      env: {
        NEXT_PUBLIC_API_MOCKING: "disabled",
        API_BASE_URL: "http://127.0.0.1:3101/",
        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:3101/",
      },
      reuseExistingServer: false,
      url: "http://127.0.0.1:3100/health",
    },
  ],
});

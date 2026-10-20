import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    env: { NEXT_PUBLIC_API_MOCKING: "enabled" },
    reuseExistingServer: !process.env.CI,
    url: "http://127.0.0.1:3000",
  },
});

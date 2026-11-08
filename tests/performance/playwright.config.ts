import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";
import config from "../../playwright.config";

if (!Array.isArray(config.webServer))
  throw new Error("E2E 서버 설정이 필요합니다.");
const cwd = resolve(__dirname, "../..");

export default defineConfig({
  ...config,
  testDir: ".",
  outputDir: resolve(cwd, "test-results/performance-runner"),
  timeout: 1_200_000,
  retries: 0,
  use: {
    ...config.use,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    trace: "off",
  },
  webServer: [
    { ...config.webServer[0], cwd },
    {
      ...config.webServer[1],
      cwd,
      command: "pnpm build && pnpm start --hostname 127.0.0.1 --port 3100",
      timeout: 240_000,
    },
  ],
});

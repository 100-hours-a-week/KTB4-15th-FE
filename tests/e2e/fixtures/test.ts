import { test as base, expect } from "@playwright/test";
import { apiURL, type Scenario } from "./chat-data";

export const test = base.extend<{ scenario: Scenario }>({
  scenario: [{}, { option: true }],
  page: async ({ page, request, scenario, context }, runTest) => {
    const response = await request.post(`${apiURL}/__test/reset`, {
      data: scenario,
    });
    expect(response.ok()).toBeTruthy();
    const externalRequests: string[] = [];
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === "127.0.0.1") return route.continue();
      externalRequests.push(url.toString());
      await route.abort();
    });
    await runTest(page);
    await page.close();
    const { data } = await (
      await request.get(`${apiURL}/__test/requests`)
    ).json();
    expect(data.unhandled, "정의되지 않은 API 호출이 없어야 함").toEqual([]);
    expect(externalRequests, "외부 서버 요청이 없어야 함").toEqual([]);
  },
});

export { expect };

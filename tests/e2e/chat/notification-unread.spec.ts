import { test, expect } from "../fixtures/test";

for (const hasUnread of [true, false]) {
  test.describe(`서버 초기 알림 상태 ${hasUnread}`, () => {
    test.use({ scenario: { hasUnreadNotifications: hasUnread } });

    test("초기 상태를 전달하고 브라우저 중복 조회를 하지 않는다", async ({
      page,
    }) => {
      let requests = 0;
      await page.route("**/notifications/unread", async (route) => {
        requests += 1;
        await route.fulfill({
          json: {
            code: "SUCCESS",
            data: { hasUnread: !hasUnread },
            message: "성공",
          },
        });
      });
      await page.route("**/notifications/stream", async (route) => {
        await route.fulfill({
          contentType: "text/event-stream",
          body: ": heartbeat\n\n",
        });
      });
      await page.goto("/chat");
      await expect(
        page.getByRole("link", {
          name: hasUnread ? "알림으로 이동, 새 알림 있음" : "알림으로 이동",
          exact: true,
        }),
      ).toBeVisible();
      await page.getByRole("button", { name: "대화 목록 열기" }).click();
      expect(requests).toBe(0);
    });
  });
}

test.describe("서버 렌더링", () => {
  test.use({
    javaScriptEnabled: false,
    scenario: { hasUnreadNotifications: true },
  });
  test("브라우저 스크립트 없이 초기 배지를 표시한다", async ({ page }) => {
    await page.goto("/chat");
    await expect(
      page.getByRole("link", {
        name: "알림으로 이동, 새 알림 있음",
        exact: true,
      }),
    ).toBeVisible();
  });
});

for (const scenario of [
  { failNotificationUnread: true },
  { notificationUnreadDelayMs: 5000 },
]) {
  test.describe(`서버 조회 복구 ${JSON.stringify(scenario)}`, () => {
    test.use({ scenario });
    test("실패·시간 초과 시 화면을 열고 브라우저에서 조회한다", async ({
      page,
    }) => {
      let requests = 0;
      await page.route("**/notifications/unread", async (route) => {
        requests += 1;
        await route.fulfill({
          json: { code: "SUCCESS", data: { hasUnread: true }, message: "성공" },
        });
      });
      await page.route("**/notifications/stream", async (route) => {
        await route.fulfill({
          contentType: "text/event-stream",
          body: ": heartbeat\n\n",
        });
      });
      await page.goto("/chat");
      await expect(
        page.getByRole("link", {
          name: "알림으로 이동, 새 알림 있음",
          exact: true,
        }),
      ).toBeVisible();
      expect(requests).toBe(1);
    });
  });
}

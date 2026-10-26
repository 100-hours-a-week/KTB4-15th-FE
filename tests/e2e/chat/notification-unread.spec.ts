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

for (const type of ["FITTING_SUCCESS", "FITTING_FAIL"]) {
  test(`채팅에서 SSE ${type} 수신 시 빨간 점과 토스트를 표시한다`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/notifications/stream", async (route) => {
      await pending;
      await route.fulfill({
        contentType: "text/event-stream",
        body: `event: connected\ndata: {"code":"NOTIFICATION_STREAM_CONNECTED","data":{"unreadCount":0,"hasUnread":false},"message":"연결"}\n\nevent: notification\ndata: {"code":"NOTIFICATION_RECEIVED","data":{"notificationId":52,"fittingJobId":123,"type":"${type}"},"message":"새 알림"}\n\n`,
      });
    });
    await page.goto("/chat");
    await expect(
      page.getByRole("link", { name: "알림으로 이동", exact: true }),
    ).toBeVisible();
    release();
    await expect(
      page.getByRole("link", {
        name: "알림으로 이동, 새 알림 있음",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        type === "FITTING_SUCCESS"
          ? "가상 피팅이 완성되었어요."
          : "가상 피팅 생성에 실패했어요.",
        { exact: true },
      ),
    ).toBeVisible();
    const action = page.getByRole("button", { name: "결과 보기", exact: true });
    if (type === "FITTING_SUCCESS") {
      await expect(action).toBeVisible();
      const box = await action.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(320);
      await action.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/fitting\/jobs\/123\/result$/);
      await expect(action).toBeHidden();
    } else {
      await expect(action).toHaveCount(0);
    }
  });
}

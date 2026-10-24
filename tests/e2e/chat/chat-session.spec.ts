import { test, expect } from "../fixtures/test";
import { apiURL, message } from "../fixtures/chat-data";
import { finishReply, input, writes } from "../fixtures/chat-actions";

for (const expiredRefresh of [false, true]) {
  test.describe(expiredRefresh ? "갱신 실패" : "갱신 성공", () => {
    test.use({ scenario: { expiredRefresh } });
    test("401 응답에서 갱신 성공 시 원래 요청을 재시도하고 만료 시 로그인으로 이동한다", async ({
      page,
      request,
    }) => {
      let attempts = 0;
      await page.route(`${apiURL}/chat-rooms`, async (route) => {
        if (route.request().method() === "POST" && attempts++ === 0) {
          await route.fulfill({
            status: 401,
            json: { code: "UNAUTHORIZED", data: null, message: "만료" },
          });
        } else await route.continue();
      });
      await page.goto("/chat");
      await input(page).fill(message);
      await input(page).press("Enter");
      if (expiredRefresh) {
        await expect(page).toHaveURL(/\/login$/);
        await expect(
          page.getByText("로그인이 만료됐어요. 다시 로그인해 주세요.", {
            exact: true,
          }),
        ).toBeVisible();
        expect(attempts).toBe(1);
        expect(await writes(request, "/chat-rooms")).toHaveLength(0);
      } else {
        await finishReply(page, request);
        expect(attempts).toBe(2);
        expect(await writes(request, "/chat-rooms")).toHaveLength(1);
      }
      expect(await writes(request, "/auth/refresh")).toHaveLength(1);
    });
  });
}

test("오프라인 전송은 입력 내용을 유지하며 연결 안내를 표시한다", async ({
  page,
  context,
  request,
}) => {
  await page.goto("/chat");
  await input(page).fill(message);
  await context.setOffline(true);
  try {
    await input(page).press("Enter");
    await expect(
      page.getByText("인터넷 연결을 확인해 주세요.", { exact: true }),
    ).toBeVisible();
    await expect(input(page)).toHaveValue(message);
    await expect(input(page)).toBeEnabled();
  } finally {
    await context.setOffline(false);
  }
  expect(await writes(request, "/chat-rooms")).toHaveLength(0);
  await input(page).press("Enter");
  await finishReply(page, request);
});

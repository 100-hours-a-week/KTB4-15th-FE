import { test, expect } from "../fixtures/test";
import { apiURL, createdAt, makeRoom, partialReply, reply } from "../data/chat";
import { input } from "../helpers/chat";

const room = makeRoom(1);
room.messages = Array.from({ length: 12 }, (_, index) => ({
  messageId: index + 1,
  senderType: "AI" as const,
  content: `이전 답변 ${index} ${"이전 상품을 비교하는 중입니다. ".repeat(20)}`,
  createdAt,
  generationStatus: null,
  recommendation: null,
}));
test.use({ scenario: { rooms: [room] } });

for (const readingHistory of [false, true]) {
  test(
    readingHistory
      ? "이전 대화에서 전송해도 위치를 유지하고 새 답변 버튼으로 이동한다"
      : "하단에서도 전송 시 위치를 유지하고 답변 완료 버튼을 표시한다",
    async ({ page, request }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/chat/1");
      await expect(page.locator('[data-message-id="12"]')).toBeInViewport();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollHeight - scrollY - innerHeight,
          ),
        )
        .toBeLessThan(120);
      if (readingHistory) {
        await page.mouse.move(190, 300);
        await page.mouse.wheel(0, -800);
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                document.documentElement.scrollHeight - scrollY - innerHeight,
            ),
          )
          .toBeGreaterThan(400);
      }
      const button = page.getByRole("button", { name: "새 답변 보기" });
      await input(page).fill("새 옷 추천");
      const before = await page.evaluate(() => scrollY);
      await input(page).press("Enter");
      await expect(page.getByText(partialReply, { exact: true })).toBeVisible();
      await expect(button).toHaveCount(0);
      expect(
        Math.abs((await page.evaluate(() => scrollY)) - before),
      ).toBeLessThan(5);

      expect(
        (await request.post(`${apiURL}/__test/finish-stream`)).ok(),
      ).toBeTruthy();
      await expect(button).toBeVisible();
      if (readingHistory) {
        expect(
          Math.abs((await page.evaluate(() => scrollY)) - before),
        ).toBeLessThan(5);
      } else {
        await page.evaluate(() =>
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "instant",
          }),
        );
        await expect(button).toBeVisible();
      }
      await button.click();
      await expect(button).toHaveCount(0);
      await expect(page.getByText(reply, { exact: true })).toBeInViewport();
    },
  );
}

test("진입과 일반 새로고침의 첫 대화 프레임에 최신 메시지가 보인다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const capture = () => {
      const log = document.querySelector('[role="log"]');
      const visible = log && getComputedStyle(log).visibility === "visible";
      const ids = visible
        ? Array.from(log.querySelectorAll<HTMLElement>("[data-message-id]"))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.bottom > 56 && rect.top < innerHeight - 80;
            })
            .map((element) => element.dataset.messageId)
        : [];
      if (ids.length) {
        Object.assign(window, { firstChatFrame: ids });
      } else requestAnimationFrame(capture);
    };
    requestAnimationFrame(capture);
  });
  await page.goto("/chat/1");
  const frames = [];
  for (const reload of [false, true]) {
    if (reload) await page.reload();
    await expect(page.locator('[data-message-id="12"]')).toBeInViewport();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { firstChatFrame?: string[] }).firstChatFrame
              ?.length ?? 0,
        ),
      )
      .toBeGreaterThan(0);
    frames.push(
      await page.evaluate(
        () =>
          (window as unknown as { firstChatFrame: string[] }).firstChatFrame,
      ),
    );
  }
  expect(frames).toEqual([
    expect.arrayContaining(["12"]),
    expect.arrayContaining(["12"]),
  ]);
});

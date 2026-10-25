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
      ? "이전 대화를 읽으면 위치를 유지하고 새 답변 버튼으로 이동한다"
      : "하단에서 기다리면 새 답변 시작으로 부드럽게 이동한다",
    async ({ page, request }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/chat/1");
      await input(page).fill("새 옷 추천");
      await input(page).press("Enter");
      await expect(page.getByText(partialReply, { exact: true })).toBeVisible();
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
      const before = await page.evaluate(() => scrollY);
      await page.evaluate(() => {
        const original = Element.prototype.scrollIntoView;
        (window as unknown as { scrollBehaviors: unknown[] }).scrollBehaviors =
          [];
        Element.prototype.scrollIntoView = function (options) {
          (
            window as unknown as { scrollBehaviors: unknown[] }
          ).scrollBehaviors.push(
            typeof options === "object" ? options.behavior : options,
          );
          original.call(this, options);
        };
      });
      expect(
        (await request.post(`${apiURL}/__test/finish-stream`)).ok(),
      ).toBeTruthy();
      await expect(page.getByText(reply, { exact: true })).toBeVisible();
      const button = page.getByRole("button", { name: "새 답변 보기" });
      if (readingHistory) {
        await expect(button).toBeVisible();
        expect(
          Math.abs((await page.evaluate(() => scrollY)) - before),
        ).toBeLessThan(5);
        await button.click();
        await expect(button).toHaveCount(0);
      } else {
        await expect(button).toHaveCount(0);
      }
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as unknown as { scrollBehaviors: unknown[] })
                .scrollBehaviors,
          ),
        )
        .toContain("smooth");
      await expect(async () => {
        const box = (await page
          .getByText(reply, { exact: true })
          .boundingBox())!;
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeLessThan(200);
      }).toPass();
    },
  );
}

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

for (const [position, title] of [
  ["bottom", "하단에서 전송하면 스트리밍과 완료 답변을 따라간다"],
  [
    "history",
    "이전 대화에서 전송해도 위치를 유지하고 새 답변 버튼으로 이동한다",
  ],
  ["read", "직접 스크롤해 새 답변이 보이면 버튼이 사라진다"],
  ["return", "답변을 기다리는 중 하단으로 돌아오면 완료 답변을 따라간다"],
]) {
  test(title, async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/chat/1");
    await expect(page.locator('[data-message-id="12"]')).toBeInViewport();
    const distanceToBottom = () =>
      page.evaluate(
        () => document.documentElement.scrollHeight - scrollY - innerHeight,
      );
    await expect.poll(distanceToBottom).toBeLessThan(64);
    if (position !== "bottom") {
      await page.mouse.move(190, 300);
      await page.mouse.wheel(0, -800);
      await expect.poll(distanceToBottom).toBeGreaterThan(400);
    }
    const button = page.getByRole("button", { name: "새 답변 보기" });
    const sentContent =
      position === "bottom" ? "THRESHOLD".repeat(55) : "새 옷 추천";
    const gapAboveReply = (content: string) =>
      page
        .getByText(sentContent, { exact: true })
        .or(page.getByText(content, { exact: true }))
        .evaluateAll(([sent, response]) => {
          const sentBottom = sent
            .closest("article")!
            .getBoundingClientRect().bottom;
          const replyTop = response
            .closest("article")!
            .getBoundingClientRect().top;
          return replyTop - sentBottom;
        });
    await input(page).fill(sentContent);
    const before = await page.evaluate(() => scrollY);
    if (position === "bottom") {
      await page.evaluate(() => {
        const positions = new Set<number>();
        let minGap = Infinity;
        const checkGap = () => {
          const previous = document.querySelector(
            '[data-message-id="12"] article',
          );
          const sent = document.querySelector('[data-message-id="13"] article');
          if (previous && sent) {
            minGap = Math.min(
              minGap,
              sent.getBoundingClientRect().top -
                previous.getBoundingClientRect().bottom,
            );
            document.documentElement.dataset.minMessageGap = String(minGap);
          }
          requestAnimationFrame(checkGap);
        };
        requestAnimationFrame(checkGap);
        window.addEventListener("scroll", () => {
          positions.add(scrollY);
          document.documentElement.dataset.scrollSteps = String(positions.size);
        });
      });
    }
    await input(page).press("Enter");
    await expect(page.getByText(partialReply, { exact: true })).toBeVisible();
    await expect(button).toHaveCount(0);
    if (position !== "bottom") {
      expect(
        Math.abs((await page.evaluate(() => scrollY)) - before),
      ).toBeLessThan(5);
    } else {
      await expect.poll(distanceToBottom).toBeLessThan(5);
    }

    if (position === "bottom") {
      expect(await gapAboveReply(partialReply)).toBe(28);
      await expect
        .poll(() =>
          page.evaluate(() =>
            Number(document.documentElement.dataset.scrollSteps),
          ),
        )
        .toBeGreaterThan(2);
    }

    if (position === "return") {
      await page.evaluate(() =>
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "instant",
        }),
      );
      await expect.poll(distanceToBottom).toBeLessThan(5);
    }

    expect(
      (await request.post(`${apiURL}/__test/finish-stream`)).ok(),
    ).toBeTruthy();
    if (position === "history" || position === "read") {
      await expect(button).toBeVisible();
      expect(
        Math.abs((await page.evaluate(() => scrollY)) - before),
      ).toBeLessThan(5);
      if (position === "read") {
        await page.getByText(reply, { exact: true }).evaluate((element) => {
          const composerHeight = parseFloat(
            getComputedStyle(element).getPropertyValue(
              "--chat-composer-height",
            ),
          );
          window.scrollBy({
            top:
              element.getBoundingClientRect().top -
              innerHeight +
              composerHeight +
              16,
            behavior: "instant",
          });
        });
        await expect.poll(distanceToBottom).toBeGreaterThan(5);
      } else {
        await button.click();
      }
      await expect(button).toHaveCount(0);
    } else {
      await expect(page.getByText(reply, { exact: true })).toBeInViewport();
      await expect.poll(distanceToBottom).toBeLessThan(5);
      await expect
        .poll(() =>
          page
            .getByRole("article")
            .filter({ hasText: reply })
            .evaluate((element) => {
              const composerHeight = parseFloat(
                getComputedStyle(element).getPropertyValue(
                  "--chat-composer-height",
                ),
              );
              return (
                element.getBoundingClientRect().bottom -
                (innerHeight - composerHeight)
              );
            }),
        )
        .toBeLessThanOrEqual(0);
      await expect(button).toHaveCount(0);
      expect(await gapAboveReply(reply)).toBe(28);
      if (position === "bottom") {
        const minimum = await page.evaluate(() =>
          Number(document.documentElement.dataset.minMessageGap),
        );
        expect(minimum).toBeGreaterThanOrEqual(0);
      }
    }
    await expect(page.getByText(reply, { exact: true })).toBeInViewport();
  });
}

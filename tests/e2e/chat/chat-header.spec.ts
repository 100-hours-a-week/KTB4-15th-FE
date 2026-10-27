import { test, expect } from "../fixtures/test";
import { createdAt, makeRoom } from "../data/chat";

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

for (const width of [390, 824]) {
  test(`채팅 헤더가 ${width}px 화면 중앙에 잘림 없이 배치된다`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/chat");
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();
    await expect(async () => {
      const contentWidth = await page.evaluate(
        () => document.body.getBoundingClientRect().width,
      );
      const box = await header.boundingBox();
      expect(box?.width).toBe(Math.min(contentWidth, 480));
      expect(box?.x).toBe((contentWidth - Math.min(contentWidth, 480)) / 2);
      for (const control of [
        header.getByRole("button", { name: "대화 목록 열기" }),
        header.getByRole("link", { name: /^알림으로 이동/ }),
      ]) {
        const controlBox = await control.boundingBox();
        expect(controlBox!.x).toBeGreaterThanOrEqual(box!.x);
        expect(controlBox!.x + controlBox!.width).toBeLessThanOrEqual(
          box!.x + box!.width,
        );
      }
    }).toPass();
  });
}

test("탭 전환 후 대화를 스크롤해도 헤더가 화면 최상단에 고정된다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/wishlists");
  await page.getByRole("link", { name: "채팅", exact: true }).click();
  await page.getByRole("button", { name: "대화 목록 열기" }).click();
  await page.getByRole("link", { name: /^대화 1 / }).click();
  await expect(page.getByRole("log").getByRole("article")).toHaveCount(12);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
  const header = page.getByRole("banner");
  await expect(async () => {
    expect((await header.boundingBox())?.y).toBe(0);
  }).toPass();
  await page.mouse.move(190, 300);
  await page.mouse.wheel(0, -300);
  await expect(async () => {
    expect((await header.boundingBox())?.y).toBe(0);
  }).toPass();
});

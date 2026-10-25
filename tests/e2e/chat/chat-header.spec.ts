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

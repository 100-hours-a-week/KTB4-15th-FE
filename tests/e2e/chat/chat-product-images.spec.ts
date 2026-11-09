import { test, expect } from "../fixtures/test";
import { createdAt, products } from "../data/chat";

test.use({
  scenario: {
    rooms: [
      {
        chatRoomId: 1,
        title: "상품 이미지 로딩",
        messages: Array.from({ length: 20 }, (_, index) => ({
          messageId: index + 1,
          senderType: "AI" as const,
          content: `추천 ${index + 1}`,
          createdAt,
          generationStatus: null,
          recommendation: { recommendationId: index + 1, products },
        })),
      },
    ],
  },
});

test("화면 밖 상품 이미지는 기다리고 스크롤로 보이면 로딩한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat/1");
  const latestImage = page
    .locator('[data-message-id="20"]')
    .getByRole("img", { name: products[0].productName, exact: true });
  await expect(latestImage).toBeInViewport();
  await expect(latestImage).toHaveAttribute("loading", "eager");
  await expect(latestImage).toHaveAttribute("fetchpriority", "high");
  const oldest = page.locator('[data-message-id="1"]');
  const oldestImage = oldest.getByRole("img", {
    name: products[0].productName,
    exact: true,
  });
  await expect(oldestImage).toHaveCount(0);
  await oldest.scrollIntoViewIfNeeded();
  await expect(oldestImage).toBeInViewport();
});

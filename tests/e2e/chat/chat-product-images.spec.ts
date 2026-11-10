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
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      const image = document.querySelector(
        '[data-chat-initial-message] img[fetchpriority="high"]',
      );
      if (!image) return;
      Object.assign(window, { serverProductImage: image });
      observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.goto("/chat/1");
  const latestImage = page
    .locator('[data-message-id="20"]')
    .getByRole("img", { name: products[0].productName, exact: true });
  await expect(latestImage).toBeInViewport();
  await expect(latestImage).toHaveAttribute("loading", "eager");
  await expect(latestImage).toHaveAttribute("fetchpriority", "high");
  await expect(page.getByRole("log")).toHaveAttribute(
    "data-initial-positioned",
    "true",
  );
  expect(
    await latestImage.evaluate(
      (image) => image === Reflect.get(window, "serverProductImage"),
    ),
  ).toBe(true);
  const oldest = page.locator('[data-message-id="1"]');
  const oldestImage = oldest.getByRole("img", {
    name: products[0].productName,
    exact: true,
  });
  await expect(oldestImage).toHaveCount(0);
  await oldest.scrollIntoViewIfNeeded();
  await expect(oldestImage).toBeInViewport();
});

test.describe("채팅방 서버 첫 화면", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

  test("클라이언트 JS 없이 최신 추천 메시지와 상품 이미지를 표시한다", async ({
    page,
  }) => {
    await page.goto("/chat/1");
    const preview = page.locator("[data-chat-initial-message]");
    await expect(preview.getByText("추천 20", { exact: true })).toBeVisible();
    const image = preview.getByRole("img", {
      name: products[0].productName,
      exact: true,
    });
    await expect(image).toBeInViewport();
    await expect(image).toHaveJSProperty("complete", true);
    expect(
      await image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    ).toBeGreaterThan(0);
  });
});

import { test, expect } from "../fixtures/test";
import { productCard, recommend } from "../helpers/chat";
import { apiURL, createdAt, makeRoom, products } from "../data/chat";

test("추천 상품 버튼은 카드가 좁으면 문구를 줄이고 아주 좁으면 세로로 배치한다", async ({
  page,
  request,
}) => {
  await recommend(page, request);
  const card = productCard(page);
  await card.getByRole("button", { name: "피팅 목록에 추가" }).click();
  const fitting = card.getByRole("button", { name: "피팅룸에서 입어보기" });
  await expect(fitting).toBeEnabled();

  for (const { width, short, stacked } of [
    { width: 1280, short: false, stacked: false },
    { width: 430, short: true, stacked: false },
    { width: 390, short: true, stacked: true },
    { width: 320, short: true, stacked: true },
  ]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(fitting).toHaveText(
      short ? /^입어보기\s*→$/ : /^피팅룸에서 입어보기\s*→$/,
      { useInnerText: true },
    );
    const product = card.getByRole("link", { name: "상품 보기" });
    await expect
      .poll(
        async () => {
          const [productBox, fittingBox] = await Promise.all([
            product.boundingBox(),
            fitting.boundingBox(),
          ]);
          if (!productBox || !fittingBox) return false;
          return stacked
            ? fittingBox.y >= productBox.y + productBox.height
            : Math.abs(fittingBox.y - productBox.y) < 1;
        },
        {
          message: `뷰포트 ${width}px에서 버튼이 예상한 방향으로 배치되어야 함`,
        },
      )
      .toBe(true);
    for (const control of [product, fitting]) {
      expect(
        await control.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
    }
  }
});

test.describe("긴 추천 상품 문구", () => {
  const product = {
    ...products[0],
    productName: "아주 긴 상품 이름 ".repeat(12).trim(),
    recommendedReason: "추천한 이유를 화면에서 끝까지 읽을 수 있어요. "
      .repeat(8)
      .trim(),
    color: "아주긴색상이름".repeat(8),
  };
  const recommendation = { recommendationId: 1, products: [product] };

  test.use({
    scenario: {
      rooms: [
        {
          ...makeRoom(1),
          messages: [
            {
              messageId: 101,
              content: "추천 상품을 확인해 주세요.",
              createdAt,
              senderType: "AI",
              generationStatus: null,
              recommendation,
            },
          ],
        },
      ],
    },
  });

  test("320px 너비에서 긴 추천 상품 정보가 잘리지 않는다", async ({ page }) => {
    await page.route(
      (url) => url.href.startsWith(`${apiURL}/chat-rooms/1/messages`),
      async (route) => {
        const response = await route.fetch();
        const body = await response.json();
        body.data.messages[0].recommendation = recommendation;
        await route.fulfill({ response, json: body });
      },
    );
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto("/chat/1");
    const card = page.getByRole("article", {
      name: `추천 상품 1: ${product.productName}`,
    });
    for (const text of [
      product.productName,
      product.recommendedReason,
      product.color,
    ]) {
      const content = card.getByText(text, { exact: true });
      await expect(content).toBeVisible();
      expect(
        await content.evaluate(
          (element) =>
            element.scrollHeight <= element.clientHeight &&
            element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
    }
  });
});

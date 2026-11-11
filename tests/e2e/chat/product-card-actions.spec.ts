import { test, expect } from "../fixtures/test";
import { productCard, recommend } from "../helpers/chat";

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

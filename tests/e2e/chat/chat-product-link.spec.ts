import { test, expect } from "../fixtures/test";
import { selectedProduct } from "../data/chat";
import { productCard, recommend } from "../helpers/chat";

test("상품 보기는 해당 상품의 구매 URL을 새 탭으로 연다", async ({
  page,
  context,
  request,
}) => {
  await recommend(page, request);
  await context.route(selectedProduct.purchaseUrl, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>테스트 상품 페이지</title>",
    }),
  );
  const popupPromise = page.waitForEvent("popup");
  await productCard(page).getByRole("link", { name: "상품 보기" }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(selectedProduct.purchaseUrl);
  await expect(page).toHaveURL(/\/chat\/1$/);
  await popup.close();
});

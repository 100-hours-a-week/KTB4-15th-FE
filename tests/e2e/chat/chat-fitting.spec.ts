import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures/test";
import { selectedProduct } from "../fixtures/chat-data";
import { productCard, recommend, writes } from "../fixtures/chat-actions";

const fittingButton = (page: Page) =>
  productCard(page).getByRole("button", { name: "피팅 목록에 추가" });

test("피팅 목록에 추가한 상품을 선택한 채 피팅룸으로 이동하고 옷장에서도 확인한다", async ({
  page,
  request,
}) => {
  await recommend(page, request);
  await fittingButton(page).click();
  await productCard(page)
    .getByRole("button", { name: "피팅룸에서 입어보기" })
    .click();
  await expect(page).toHaveURL(/\/fitting$/);
  await expect(
    page.getByRole("link", { name: "피팅할 하의 선택하기" }),
  ).toContainText(selectedProduct.productName);
  await expect(
    page.getByRole("link", { name: "피팅할 상의 선택하기" }),
  ).toContainText("선택 안 함");
  await page.getByRole("link", { name: "피팅할 하의 선택하기" }).click();
  await expect(page).toHaveURL(/\/fitting\/wardrobe\?itemType=BOTTOM$/);
  await expect(
    page.getByRole("button", { name: new RegExp(selectedProduct.productName) }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", { name: new RegExp(selectedProduct.productName) }),
  ).toHaveAttribute("aria-pressed", "true");
  expect((await writes(request, "/fitting-candidates"))[0].body).toEqual({
    productId: selectedProduct.productId,
  });
});

test.describe("피팅 목록 추가 실패", () => {
  test.use({ scenario: { failFitting: true } });
  test("입어보기로 바뀌지 않고 재시도한 뒤 피팅룸에 진입할 수 있다", async ({
    page,
    request,
  }) => {
    await recommend(page, request);
    await fittingButton(page).click();
    await expect(
      page.getByText("피팅 목록에 추가하지 못했어요.", { exact: true }),
    ).toBeVisible();
    await expect(fittingButton(page)).toBeEnabled();
    await expect(
      productCard(page).getByRole("button", { name: "피팅룸에서 입어보기" }),
    ).toHaveCount(0);
    await fittingButton(page).click();
    await productCard(page)
      .getByRole("button", { name: "피팅룸에서 입어보기" })
      .click();
    await expect(page).toHaveURL(/\/fitting$/);
    await expect(
      page.getByRole("link", { name: "피팅할 하의 선택하기" }),
    ).toContainText(selectedProduct.productName);
    expect(await writes(request, "/fitting-candidates")).toHaveLength(2);
  });
});

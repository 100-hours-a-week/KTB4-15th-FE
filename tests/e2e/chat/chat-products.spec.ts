import { test, expect } from "../fixtures/test";
import { productCard, recommend } from "../helpers/chat";
import { configure } from "../helpers/mock-api";
import { selectedProduct } from "../data/chat";

test("추천 상품 페이지 버튼으로 상품을 전환하고 현재 위치를 표시한다", async ({
  page,
  request,
}) => {
  await recommend(page, request);
  const first = page.getByRole("button", {
    name: "추천 상품 1 보기",
    exact: true,
  });
  const second = page.getByRole("button", {
    name: "추천 상품 2 보기",
    exact: true,
  });
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await expect(productCard(page)).toBeInViewport();
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
});

test.describe("찜 한도 초과", () => {
  test.use({ scenario: { wishlistLimit: true } });
  test("300개 한도를 안내하며 찜하지 않은 상태를 유지한다", async ({
    page,
    request,
  }) => {
    await recommend(page, request);
    const button = productCard(page).getByRole("button", {
      name: `${selectedProduct.productName} 찜 하기`,
    });
    await button.click();
    await expect(
      page.getByText("찜 목록은 최대 300개까지 추가할 수 있어요.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(button).toBeEnabled();
  });
});

for (const failure of ["generatingFitting", "failCurrentFitting"] as const) {
  test(`피팅 진입 제한: ${failure}`, async ({ page, request }) => {
    await recommend(page, request);
    await productCard(page)
      .getByRole("button", { name: "피팅 목록에 추가" })
      .click();
    const enter = productCard(page).getByRole("button", {
      name: "피팅룸에서 입어보기",
    });
    await expect(enter).toBeVisible();
    await configure(request, { [failure]: true });
    await enter.click();
    await expect(
      page.getByText(
        failure === "generatingFitting"
          ? "다른 피팅 작업 중입니다. 잠시 후 다시 시도해주세요."
          : "피팅 작업을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/chat\/1$/);
    await expect(enter).toBeEnabled();
    await configure(request, { [failure]: false });
    await enter.click();
    await expect(page).toHaveURL(/\/fitting$/);
    await expect(
      page.getByRole("link", { name: "피팅할 하의 선택하기" }),
    ).toContainText(selectedProduct.productName);
  });
}

test("이미 피팅 목록에 있는 상품은 다시 추가하지 않고 바로 피팅룸으로 연결한다", async ({
  page,
  request,
}) => {
  await recommend(page, request);
  await productCard(page)
    .getByRole("button", { name: "피팅 목록에 추가" })
    .click();
  await expect(
    productCard(page).getByRole("button", { name: "피팅룸에서 입어보기" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    productCard(page).getByRole("button", { name: "피팅 목록에 추가" }),
  ).toHaveCount(0);
  await productCard(page)
    .getByRole("button", { name: "피팅룸에서 입어보기" })
    .click();
  await expect(page).toHaveURL(/\/fitting$/);
  await expect(
    page.getByRole("link", { name: "피팅할 하의 선택하기" }),
  ).toContainText(selectedProduct.productName);
});

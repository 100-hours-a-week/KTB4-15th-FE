import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures/test";
import { apiURL, products, selectedProduct } from "../data/chat";
import { productCard, recommend } from "../helpers/chat";
import { writes } from "../helpers/mock-api";

const wishlistButton = (page: Page) =>
  productCard(page).getByRole("button", {
    name: `${selectedProduct.productName} 찜 하기`,
  });

async function openWishlistFromMenu(page: Page) {
  // 답변 자동 스크롤이 끝날 때까지 숨겨진 메뉴를 위로 스크롤해 다시 연다.
  await expect(async () => {
    await page.mouse.wheel(0, -1000);
    await page
      .getByRole("link", { name: "찜", exact: true })
      .click({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/wishlists$/);
}

for (const surface of ["채팅", "찜 목록"] as const) {
  test(`${surface}에서 찜 취소 후 새로고침하면 해당 상품만 목록에서 사라진다`, async ({
    page,
    request,
  }) => {
    await recommend(page, request);
    await wishlistButton(page).click();
    const cancel = page.getByRole("button", {
      name: `${selectedProduct.productName} 찜 해제`,
      exact: true,
    });
    await expect(cancel).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", {
        name: `${products[0].productName} 찜 하기`,
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", {
        name: `${products[0].productName} 찜 해제`,
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    if (surface === "찜 목록") {
      await page.goto("/wishlists");
      await expect(page).toHaveURL(/\/wishlists$/);
    }
    await cancel.click();
    await expect(
      page.getByRole("button", {
        name: `${selectedProduct.productName} 찜 하기`,
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "false");
    await page.reload();
    if (surface === "채팅") {
      await expect(wishlistButton(page)).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await page.goto("/wishlists");
    }
    await expect(
      page.getByText(selectedProduct.productName, { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText(products[0].productName, { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText(selectedProduct.productName, { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText(products[0].productName, { exact: true }),
    ).toBeVisible();
    const { data } = await (
      await request.get(`${apiURL}/__test/requests`)
    ).json();
    expect(
      data.requests.filter(
        (item: { method: string }) => item.method === "DELETE",
      ),
    ).toEqual([
      {
        method: "DELETE",
        path: `/wishlists/${selectedProduct.productId + 1000}`,
        body: null,
      },
    ]);
  });

  test.describe(`${surface} 찜 취소 실패`, () => {
    test.use({ scenario: { failDeleteWishlist: true } });
    test("오류를 알리고 찜 상태와 목록의 상품을 유지한다", async ({
      page,
      request,
    }) => {
      await recommend(page, request);
      await wishlistButton(page).click();
      const cancel = page.getByRole("button", {
        name: `${selectedProduct.productName} 찜 해제`,
        exact: true,
      });
      await expect(cancel).toHaveAttribute("aria-pressed", "true");
      if (surface === "찜 목록") {
        await page.goto("/wishlists");
        await expect(page).toHaveURL(/\/wishlists$/);
      }
      await cancel.click();
      await expect(
        page.getByText("찜을 해제하지 못했어요.", { exact: true }),
      ).toBeVisible();
      await expect(cancel).toHaveAttribute("aria-pressed", "true");
      await expect(cancel).toBeEnabled();
      await page.reload();
      await expect(cancel).toHaveAttribute("aria-pressed", "true");
      if (surface === "채팅") await page.goto("/wishlists");
      await expect(page).toHaveURL(/\/wishlists$/);
      await expect(
        page.getByText(selectedProduct.productName, { exact: true }),
      ).toBeVisible();
    });
  });
}

test("두 번째 추천 상품을 찜하면 찜 목록과 새로고침 후에도 같은 상품이 보인다", async ({
  page,
  request,
}) => {
  await recommend(page, request);
  await wishlistButton(page).click();
  await expect(
    productCard(page).getByRole("button", {
      name: `${selectedProduct.productName} 찜 해제`,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await openWishlistFromMenu(page);
  await expect(page).toHaveURL(/\/wishlists$/);
  await expect(
    page.getByText(selectedProduct.productName, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(products[0].productName, { exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText(selectedProduct.productName, { exact: true }),
  ).toBeVisible();
  expect((await writes(request, "/wishlists"))[0].body).toEqual({
    productId: selectedProduct.productId,
  });
});

test.describe("찜 저장 실패", () => {
  test.use({ scenario: { failWishlist: true } });
  test("찜 상태를 바꾸지 않고 재시도한 상품만 목록에 저장한다", async ({
    page,
    request,
  }) => {
    await recommend(page, request);
    await wishlistButton(page).click();
    await expect(
      page.getByText("찜 목록에 추가하지 못했어요.", { exact: true }),
    ).toBeVisible();
    await expect(wishlistButton(page)).toHaveAttribute("aria-pressed", "false");
    await expect(wishlistButton(page)).toBeEnabled();
    await expect(
      page.getByText("찜 목록에 추가했어요.", { exact: true }),
    ).toHaveCount(0);
    await wishlistButton(page).click();
    await expect(
      productCard(page).getByRole("button", {
        name: `${selectedProduct.productName} 찜 해제`,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await openWishlistFromMenu(page);
    await expect(page).toHaveURL(/\/wishlists$/);
    await expect(
      page.getByText(selectedProduct.productName, { exact: true }),
    ).toBeVisible();
    expect(await writes(request, "/wishlists")).toHaveLength(2);
  });
});

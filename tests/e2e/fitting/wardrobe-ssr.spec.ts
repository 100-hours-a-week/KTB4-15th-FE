import { test, expect } from "../fixtures/test";
import { apiURL, products } from "../data/chat";

test("옷장 초기 HTML에 상품과 우선 이미지를 포함하고 중복 조회 없이 필터·선택을 지원한다", async ({
  page,
  request,
}) => {
  for (const product of products) {
    expect(
      (
        await request.post(`${apiURL}/fitting-candidates`, {
          data: { productId: product.productId },
        })
      ).ok(),
    ).toBeTruthy();
  }
  const browserRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith(`${apiURL}/fitting-candidates`)) {
      browserRequests.push(request.url());
    }
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" />',
    }),
  );
  const response = await page.goto("/fitting/wardrobe");
  const html = await response!.text();
  expect(html).toContain(products[0].productName);
  expect(html).toContain(products[1].productName);
  const images = (html.match(/<img\b[^>]*>/g) ?? []).filter((tag) =>
    tag.includes("productImage"),
  );
  expect(images).toHaveLength(2);
  expect(images[0]).toContain('loading="eager"');
  expect(images[0]).toMatch(/fetch[Pp]riority="high"/);
  expect(images[1]).toContain('loading="lazy"');
  const top = page.getByRole("button", {
    name: new RegExp(products[0].productName),
  });
  await top.click();
  await expect(top).toHaveAttribute("aria-pressed", "true");
  expect(browserRequests).toEqual([]);
  await page.getByRole("button", { name: "편집", exact: true }).click();
  await page.getByRole("button", { name: /전체 선택/ }).click();
  await expect(
    page.getByRole("button", { name: "2개 삭제하기" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "완료", exact: true }).click();
  await expect(top).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "편집", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "0개 삭제하기" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "완료", exact: true }).click();
  await page.getByRole("tab", { name: "하의", exact: true }).click();
  await expect(
    page.getByRole("button", { name: new RegExp(products[1].productName) }),
  ).toBeVisible();
  await expect(top).toHaveCount(0);
  await expect(page).toHaveURL(/\/fitting\/wardrobe\?itemType=BOTTOM$/);
  await page.reload();
  await expect(
    page.getByRole("tab", { name: "하의", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});

test("서버의 빈 옷장 응답은 빈 상태로 표시한다", async ({ page }) => {
  await page.goto("/fitting/wardrobe?itemType=TOP");
  await expect(page.getByText("담아둔 상품이 아직 없어요.")).toBeVisible();
  await expect(
    page.getByRole("status", { name: "옷장을 불러오고 있어요" }),
  ).toHaveCount(0);
});

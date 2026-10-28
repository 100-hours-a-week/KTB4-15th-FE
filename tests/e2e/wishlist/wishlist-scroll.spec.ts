import { test, expect } from "../fixtures/test";
import { apiURL, products } from "../data/chat";

test("추가 목록을 붙여도 스크롤 위치를 유지하고 다시 내려야 다음 페이지를 조회한다", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await request.post(`${apiURL}/__test/scenario`, {
    data: {
      wishlistProducts: Array.from({ length: 70 }, (_, index) => ({
        ...products[0],
        productId: index + 1000,
        productName: `스크롤 상품 ${index + 1}`,
      })),
    },
  });
  let release: () => void = () => {};
  const responseGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route(`${apiURL}/wishlists?**`, async (route) => {
    if (new URL(route.request().url()).searchParams.has("cursor")) {
      requests += 1;
      await responseGate;
    }
    await route.continue();
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "unavailable" }),
  );
  await page.goto("/wishlists");
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  await expect.poll(() => requests).toBe(1);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  release();
  await expect(page.getByRole("article")).toHaveCount(40);
  await page.waitForTimeout(1500);
  expect(requests).toBe(1);
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore),
  ).toBeLessThan(5);
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  await expect(page.getByRole("article")).toHaveCount(60);
  await page.waitForTimeout(1500);
  expect(requests).toBe(2);
});

for (const screen of ["wardrobe", "wishlist"] as const) {
  test(`${screen}: 하단이 계속 보여도 멈추고 새 스크롤에서만 추가 조회한다`, async ({
    page,
    request,
  }) => {
    const items = Array.from({ length: 100 }, (_, index) => ({
      ...products[0],
      fittingCandidateId: index + 1000,
      productId: index + 1000,
      productName: `연속 조회 상품 ${index + 1}`,
    }));
    await request.post(`${apiURL}/__test/scenario`, {
      data:
        screen === "wardrobe"
          ? { fittingCandidates: items }
          : { wishlistProducts: items },
    });
    let requests = 0;
    const endpoint = screen === "wardrobe" ? "fitting-candidates" : "wishlists";
    await page.route(`${apiURL}/${endpoint}?**`, async (route) => {
      if (new URL(route.request().url()).searchParams.has("cursor"))
        requests += 1;
      await route.continue();
    });
    await page.route("**/_next/image?**", (route) =>
      route.fulfill({ status: 404, body: "unavailable" }),
    );
    await page.goto(
      screen === "wardrobe" ? "/fitting/wardrobe?itemType=TOP" : "/wishlists",
    );
    if (screen === "wardrobe") {
      await page.getByRole("button", { name: "편집", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "완료", exact: true }),
      ).toBeVisible();
    }
    // 응답 뒤에도 감지 영역이 화면에 남는 조건을 고정한다.
    await page.addStyleTag({
      content:
        '[class*="loadMore"] { position: fixed; bottom: 100px; height: 24px; }',
    });
    await page.mouse.wheel(0, 150);
    await expect.poll(() => requests).toBe(1);
    // 같은 스크롤 구간의 이동이 이어져도 추가 요청하지 않는다.
    for (let step = 0; step < 6; step += 1) {
      await page.mouse.wheel(0, 20);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(1500);
    expect(requests).toBe(1);
    await page.mouse.wheel(0, 150);
    await expect.poll(() => requests).toBe(2);
    await page.waitForTimeout(1500);
    expect(requests).toBe(2);
  });
}

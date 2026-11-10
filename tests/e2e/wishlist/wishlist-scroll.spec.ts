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
  let hydrate: () => void = () => {};
  const hydrationGate = new Promise<void>((resolve) => {
    hydrate = resolve;
  });
  await page.route(/\/_next\/static\/.*\.js(?:\?|$)/, async (route) => {
    await hydrationGate;
    await route.continue();
  });
  await page.goto("/wishlists", { waitUntil: "commit" });
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  expect(requests).toBe(0);
  hydrate();
  await expect.poll(() => requests).toBe(1);
  await expect(
    page.getByRole("status", { name: "찜 목록을 더 불러오고 있어요" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "더 불러오기", exact: true }),
  ).toHaveCount(0);
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
  test(`${screen}: 위로 되돌리지 않고 아래로 계속 스크롤해 추가 조회한다`, async ({
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
    await page.setViewportSize({ width: 390, height: 844 });
    const cards =
      screen === "wardrobe"
        ? page.getByRole("button", { name: /연속 조회 상품/ })
        : page.getByRole("article");
    const pageSize = screen === "wardrobe" ? 10 : 20;
    for (let nextPage = 1; nextPage <= 2; nextPage += 1) {
      await page.mouse.wheel(0, 10000);
      await expect(cards).toHaveCount(pageSize * (nextPage + 1));
      expect(requests).toBe(nextPage);
    }
  });
}

test("503 추가 조회는 총 세 번 시도한 뒤 수동 재시도를 표시한다", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await request.post(`${apiURL}/__test/scenario`, {
    data: {
      wishlistProducts: Array.from({ length: 25 }, (_, index) => ({
        ...products[0],
        productId: index + 2000,
      })),
    },
  });
  let attempts = 0;
  await page.route(`${apiURL}/wishlists?**`, async (route) => {
    if (!new URL(route.request().url()).searchParams.has("cursor"))
      return route.continue();
    attempts += 1;
    await route.fulfill({
      status: 503,
      json: { code: "ERROR", message: "일시적 오류", data: null },
    });
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "unavailable" }),
  );
  await page.goto("/wishlists");
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "다시 시도", exact: true }),
  ).toBeVisible();
  expect(attempts).toBe(3);
});

test("스피너는 200ms 후 표시되며 빠른 완료에는 남지 않는다", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await request.post(`${apiURL}/__test/scenario`, {
    data: {
      wishlistProducts: Array.from({ length: 60 }, (_, index) => ({
        ...products[0],
        productId: index + 3000,
      })),
    },
  });
  let release: () => void = () => {};
  let gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`${apiURL}/wishlists?**`, async (route) => {
    await gate;
    await route.continue();
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "unavailable" }),
  );
  await page.goto("/wishlists");
  const spinner = page.locator(
    '[role="status"][aria-label="찜 목록을 더 불러오고 있어요"]',
  );
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  await spinner.waitFor({ state: "attached" });
  await spinner.evaluate((element) => {
    const animation = element.parentElement!.getAnimations()[0];
    animation.pause();
    animation.currentTime = 100;
  });
  await expect(spinner).toBeHidden();
  release();
  await expect(page.getByRole("article")).toHaveCount(40);
  await expect(spinner).toHaveCount(0);
  gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  await spinner.waitFor({ state: "attached" });
  await spinner.evaluate((element) => {
    const animation = element.parentElement!.getAnimations()[0];
    animation.pause();
    animation.currentTime = 199;
  });
  await expect(spinner).toBeHidden();
  await spinner.evaluate((element) => {
    element.parentElement!.getAnimations()[0].currentTime = 200;
  });
  await expect(spinner).toBeVisible();
  release();
  await expect(page.getByRole("article")).toHaveCount(60);
  await expect(spinner).toHaveCount(0);
});

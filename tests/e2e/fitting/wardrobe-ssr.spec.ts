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
  const selectAll = page.getByRole("button", {
    name: "전체 선택",
    exact: true,
  });
  await selectAll.click();
  await expect(selectAll).toHaveAccessibleDescription("선택 2개");
  await page.getByRole("button", { name: "상의", exact: true }).click();
  await expect(selectAll).toHaveAccessibleDescription("선택 1개");
  await selectAll.click();
  await expect(selectAll).toHaveAccessibleDescription("선택 0개");
  await page.getByRole("button", { name: "하의", exact: true }).click();
  await expect(selectAll).toHaveAccessibleDescription("선택 1개");
  await page.getByRole("button", { name: "전체", exact: true }).click();
  await expect(selectAll).toHaveAccessibleDescription("선택 1개");
  await page.getByRole("button", { name: "상의", exact: true }).click();
  await expect(selectAll).toHaveAccessibleDescription("선택 0개");
  await selectAll.click();
  await expect(selectAll).toHaveAccessibleDescription("선택 1개");
  const remove = page.getByRole("button", { name: "2개 삭제하기" });
  await remove.click();
  const review = page.getByRole("dialog", {
    name: "선택한 상품 2개를 삭제할까요?",
  });
  await expect(review).toHaveAccessibleDescription(
    "상의 1개 · 하의 1개 삭제한 상품은 옷장에서 사라집니다.",
  );
  const cancel = review.getByRole("button", { name: "취소" });
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(review).toBeHidden();
  await expect(remove).toBeFocused();
  await page.getByRole("button", { name: "완료", exact: true }).click();
  await expect(top).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "편집", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "0개 삭제하기" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "완료", exact: true }).click();
  await page.getByRole("button", { name: "하의", exact: true }).press("Enter");
  await expect(
    page.getByRole("button", { name: new RegExp(products[1].productName) }),
  ).toBeVisible();
  await expect(top).toHaveCount(0);
  await expect(page).toHaveURL(/\/fitting\/wardrobe\?itemType=BOTTOM$/);
  expect(browserRequests).toEqual([]);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "하의", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("서버의 빈 옷장 응답은 빈 상태로 표시한다", async ({ page }) => {
  await page.goto("/fitting/wardrobe?itemType=TOP");
  await expect(
    page.getByRole("main").getByText("담아둔 상품이 아직 없어요."),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "옷장을 불러오고 있어요" }),
  ).toHaveCount(0);
});

test("서버 카드에서 이미지 실패 대체 표시·선택·삭제 후 새 목록을 반영한다", async ({
  page,
  request,
}) => {
  await request.post(`${apiURL}/fitting-candidates`, {
    data: { productId: products[0].productId },
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "unavailable" }),
  );
  await page.goto("/fitting/wardrobe?itemType=TOP");
  const card = page.getByRole("button", {
    name: new RegExp(products[0].productName),
  });
  await expect(card.getByLabel("상품 이미지 없음")).toBeVisible();
  await card.click();
  await expect(card).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "편집", exact: true }).click();
  await expect(card).toHaveAttribute("aria-pressed", "false");
  await card.click();
  await expect(card).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "1개 삭제하기" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "삭제하기", exact: true })
    .click();
  await expect(card).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "완료", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "완료", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "선택 완료 (0/2)" }),
  ).toBeVisible();
  await expect(page.getByText("담아둔 상품이 아직 없어요.")).toBeVisible();
});

test("추가 페이지 카드도 선택·편집을 지원한다", async ({ page, request }) => {
  await request.post(`${apiURL}/fitting-candidates`, {
    data: { productId: products[0].productId },
  });
  const extra = {
    ...products[1],
    productId: 303,
    fittingCandidateId: 303,
    productName: "추가 하의",
    productImageUrl: "",
  };
  await page.route(`${apiURL}/fitting-candidates?**`, (route) => {
    const url = new URL(route.request().url());
    const nextPage = url.searchParams.has("cursor");
    return route.fulfill({
      json: {
        code: "SUCCESS",
        message: "",
        data: {
          items: nextPage
            ? [extra]
            : [{ ...products[1], fittingCandidateId: products[1].productId }],
          totalCount: 2,
          hasNext: !nextPage,
          nextCursor: nextPage ? null : products[1].productId,
        },
      },
    });
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "unavailable" }),
  );
  await page.goto("/fitting/wardrobe?itemType=TOP");
  await page.getByRole("button", { name: "하의", exact: true }).click();
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  const card = page.getByRole("button", { name: /추가 하의/ });
  await expect(card).toBeVisible();
  await card.click();
  await expect(card).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "편집", exact: true }).click();
  await card.click();
  await expect(
    page.getByRole("button", { name: "1개 삭제하기" }),
  ).toBeEnabled();
});

test("첫 10개만 보여도 현재 필터의 상품 전체를 검토하고 삭제할 수 있다", async ({
  page,
  request,
}) => {
  const tops = Array.from({ length: 125 }, (_, index) => ({
    ...products[0],
    fittingCandidateId: index + 1000,
    productId: index + 1000,
    productName: `실험 상품 ${index + 1}`,
  }));
  await request.post(`${apiURL}/__test/scenario`, {
    data: {
      fittingCandidates: [
        ...tops,
        { ...products[1], fittingCandidateId: products[1].productId },
      ],
    },
  });
  const listRequests: URL[] = [];
  let releaseFirstRequest!: () => void;
  const firstRequest = new Promise<void>((resolve) => {
    releaseFirstRequest = resolve;
  });
  await page.route(
    (url) => url.pathname === "/fitting-candidates",
    async (route) => {
      if (route.request().method() === "GET") {
        const url = new URL(route.request().url());
        listRequests.push(url);
        if (listRequests.length === 1) {
          await firstRequest;
          await route.fulfill({
            status: 400,
            json: { code: "ERROR", data: null, message: "조회 실패" },
          });
          return;
        }
      }
      if (route.request().method() === "DELETE") {
        await route.fulfill({
          json: {
            code: "SUCCESS",
            data: { deletedCount: tops.length },
            message: "",
          },
        });
        return;
      }
      await route.continue();
    },
  );
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "unavailable" }),
  );
  const response = await page.goto("/fitting/wardrobe?itemType=TOP");
  const html = await response!.text();
  expect(
    (html.match(/<img\b[^>]*>/g) ?? []).filter((tag) =>
      tag.includes("productImage"),
    ),
  ).toHaveLength(10);
  const cards = page.getByRole("button", { name: /실험 상품/ });
  await expect(cards).toHaveCount(10);
  expect(listRequests).toHaveLength(0);

  await page.getByRole("button", { name: "편집", exact: true }).click();
  await expect.poll(() => listRequests.length).toBe(1);
  const selectAll = page.getByRole("button", {
    name: "전체 선택",
    exact: true,
  });
  const firstCard = cards.first();
  const initialTop = (await firstCard.boundingBox())!.y;
  await selectAll.click();
  try {
    await expect(
      selectAll.getByText("전체 선택", { exact: true }),
    ).toBeVisible();
    await expect(selectAll).toHaveAccessibleDescription("선택 0개");
    await expect(selectAll).toHaveAttribute("aria-disabled", "true");
    expect(listRequests).toHaveLength(1);
    await expect(page.getByRole("status")).toHaveText(
      "선택할 상품을 불러오고 있어요.",
    );
    expect((await firstCard.boundingBox())!.y).toBeCloseTo(initialTop, 0);
  } finally {
    releaseFirstRequest();
  }
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "전체 상품을 불러오지 못했어요. 다시 시도해 주세요.",
  );
  await expect(
    page.getByRole("button", { name: "0개 삭제하기" }),
  ).toBeDisabled();
  await selectAll.click();
  await expect(selectAll).toHaveAttribute("aria-pressed", "true");
  await expect(selectAll).toHaveAccessibleDescription("선택 125개");
  await expect(cards).toHaveCount(10);
  expect((await firstCard.boundingBox())!.y).toBeCloseTo(initialTop, 0);
  expect(listRequests.map((url) => url.searchParams.get("cursor"))).toEqual([
    "1009",
    "1009",
    "1109",
  ]);
  expect(
    listRequests.every((url) => url.searchParams.get("itemType") === "TOP"),
  ).toBe(true);

  await selectAll.click();
  await expect(selectAll).toHaveAttribute("aria-pressed", "false");
  await selectAll.click();
  await expect(selectAll).toHaveAttribute("aria-pressed", "true");
  expect(listRequests).toHaveLength(3);

  const remove = page.getByRole("button", { name: "125개 삭제하기" });
  await remove.click();
  const review = page.getByRole("dialog");
  await expect(review).toHaveAccessibleDescription(
    "상의 125개 삭제한 상품은 옷장에서 사라집니다.",
  );
  const deletion = page.waitForRequest(
    (request) =>
      request.method() === "DELETE" &&
      request.url() === `${apiURL}/fitting-candidates`,
  );
  await review.getByRole("button", { name: "삭제하기", exact: true }).click();
  expect((await deletion).postDataJSON()).toEqual({
    fittingCandidateIds: tops.map((product) => product.fittingCandidateId),
  });
  await expect(review).toBeHidden();
});

test("전체 탭에서 미리 받은 상품을 목록 스크롤과 필터 전환에 재사용한다", async ({
  page,
  request,
}) => {
  await request.post(`${apiURL}/__test/scenario`, {
    data: {
      fittingCandidates: [
        ...Array.from({ length: 25 }, (_, index) => ({
          ...products[0],
          productId: 1000 + index,
          productName: `미리 조회한 상의 ${index + 1}`,
        })),
        products[1],
      ],
    },
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "unavailable" }),
  );
  await page.goto("/fitting/wardrobe");
  const tops = page.getByRole("button", { name: /미리 조회한 상의/ });
  await expect(tops).toHaveCount(10);

  const prefetch = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname === "/fitting-candidates" &&
      url.searchParams.get("size") === "100"
    );
  });
  await page.getByRole("button", { name: "편집", exact: true }).click();
  await prefetch;
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  await expect(tops).toHaveCount(20);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  await expect(tops).toHaveCount(25);

  await page.getByRole("button", { name: "상의", exact: true }).click();
  const selectAll = page.getByRole("button", {
    name: "전체 선택",
    exact: true,
  });
  await selectAll.click();
  await expect(selectAll).toHaveAccessibleDescription("선택 25개");
  await page.getByRole("button", { name: "하의", exact: true }).click();
  const bottom = page.getByRole("button", {
    name: new RegExp(products[1].productName),
  });
  await expect(bottom).toBeVisible();
  await expect(tops).toHaveCount(0);

  const { data } = await (
    await request.get(`${apiURL}/__test/requests`)
  ).json();
  expect(
    data.requests.filter(
      (entry: { method: string; path: string }) =>
        entry.method === "GET" && entry.path === "/fitting-candidates",
    ),
  ).toHaveLength(2);
});

test("추가 조회 실패 후 자동 요청을 멈추고 수동 재시도로 복구한다", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await request.post(`${apiURL}/__test/scenario`, {
    data: {
      fittingCandidates: Array.from({ length: 11 }, (_, index) => ({
        ...products[0],
        fittingCandidateId: index + 1000,
        productId: index + 1000,
        productName: `복구 상품 ${index + 1}`,
      })),
    },
  });
  let fail = true;
  let attempts = 0;
  await page.route(`${apiURL}/fitting-candidates?**`, (route) => {
    if (new URL(route.request().url()).searchParams.has("cursor")) {
      attempts += 1;
      if (fail)
        return route.fulfill({
          status: 400,
          json: { code: "ERROR", message: "조회 실패", data: null },
        });
    }
    return route.continue();
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "unavailable" }),
  );
  await page.goto("/fitting/wardrobe?itemType=TOP");
  // 클릭을 위한 자동 스크롤도 추가 조회를 시작하므로 스크롤로 직접 진입한다.
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  const retry = page.getByRole("button", { name: "다시 시도" });
  await expect(retry).toBeVisible({ timeout: 20000 });
  const failedAttempts = attempts;
  expect(failedAttempts).toBe(1);
  await page.waitForTimeout(1500);
  expect(attempts).toBe(failedAttempts);
  await expect(page.getByRole("button", { name: /복구 상품/ })).toHaveCount(10);
  fail = false;
  await retry.click();
  await expect(page.getByRole("button", { name: /복구 상품/ })).toHaveCount(11);
});

test("삭제 실패 시 선택을 유지하고 처리되지 않은 오류 없이 재시도한다", async ({
  page,
  request,
}) => {
  await request.post(`${apiURL}/fitting-candidates`, {
    data: { productId: products[0].productId },
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let fail = true;
  await page.route(`${apiURL}/fitting-candidates`, (route) => {
    if (route.request().method() === "DELETE" && fail) {
      return route.fulfill({
        status: 400,
        json: { code: "ERROR", message: "삭제 실패", data: null },
      });
    }
    return route.continue();
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "unavailable" }),
  );
  await page.goto("/fitting/wardrobe?itemType=TOP");
  const card = page.getByRole("button", {
    name: new RegExp(products[0].productName),
  });
  await card.click();
  await page.getByRole("button", { name: "편집", exact: true }).click();
  await card.click();
  const remove = page.getByRole("button", { name: "1개 삭제하기" });
  await remove.click();
  const review = page.getByRole("dialog");
  const confirm = review.getByRole("button", { name: "삭제하기", exact: true });
  await confirm.click();
  await expect(review.getByRole("alert")).toHaveText(
    "상품을 삭제하지 못했어요.",
  );
  await expect(review).toHaveAccessibleDescription(
    "상의 1개 삭제한 상품은 옷장에서 사라집니다.",
  );
  expect(errors).toEqual([]);
  fail = false;
  await confirm.click();
  await expect(card).toHaveCount(0);
  await page.getByRole("button", { name: "완료", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "선택 완료 (0/2)" }),
  ).toBeVisible();
});

test("추가 목록을 붙여도 스크롤 위치를 유지하고 다시 내려야 다음 페이지를 조회한다", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await request.post(`${apiURL}/__test/scenario`, {
    data: {
      fittingCandidates: Array.from({ length: 50 }, (_, index) => ({
        ...products[0],
        fittingCandidateId: index + 1000,
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
  await page.route(`${apiURL}/fitting-candidates?**`, async (route) => {
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
  await page.goto("/fitting/wardrobe?itemType=TOP", { waitUntil: "commit" });
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  expect(requests).toBe(0);
  hydrate();
  await expect.poll(() => requests).toBe(1);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  release();
  await expect(page.getByRole("button", { name: /스크롤 상품/ })).toHaveCount(
    20,
  );
  await page.waitForTimeout(1500);
  expect(requests).toBe(1);
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore),
  ).toBeLessThan(5);
  await page.locator('[class*="loadMore"]').scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: /스크롤 상품/ })).toHaveCount(
    30,
  );
  await page.waitForTimeout(1500);
  expect(requests).toBe(2);
});

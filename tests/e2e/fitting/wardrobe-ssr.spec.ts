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
  await expect(card).toHaveCount(0);
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
  await page.getByRole("tab", { name: "하의", exact: true }).click();
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

test("API·초기 HTML을 10개로 맞추고 다음 페이지와 전체 선택을 지원한다", async ({
  page,
  request,
}) => {
  await request.post(`${apiURL}/__test/scenario`, {
    data: {
      fittingCandidates: Array.from({ length: 25 }, (_, index) => ({
        ...products[0],
        fittingCandidateId: index + 1000,
        productId: index + 1000,
        productName: `실험 상품 ${index + 1}`,
      })),
    },
  });
  const listRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith(`${apiURL}/fitting-candidates`))
      listRequests.push(request.url());
  });
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
  const selectAll = page.getByRole("button", { name: /전체 선택/ });
  await selectAll.click();
  await expect(
    page.getByRole("button", { name: "10개 삭제하기" }),
  ).toBeEnabled();
  await page.locator('[class*="__loadMore"]').scrollIntoViewIfNeeded();
  await expect(cards).toHaveCount(25);
  await selectAll.click();
  await expect(
    page.getByRole("button", { name: "25개 삭제하기" }),
  ).toBeEnabled();
  expect(listRequests).toHaveLength(2);
  expect(
    listRequests.map((url) => new URL(url).searchParams.get("size")),
  ).toEqual(["10", "10"]);
  expect(
    listRequests.map((url) => new URL(url).searchParams.get("cursor")),
  ).toEqual(["1009", "1019"]);
  await page.getByRole("button", { name: "완료", exact: true }).click();
  await page.getByRole("tab", { name: "하의", exact: true }).click();
  await expect(cards).toHaveCount(0);
  await expect(page).toHaveURL(/itemType=BOTTOM/);
  await page.getByRole("tab", { name: "상의", exact: true }).click();
  await expect(page).toHaveURL(/itemType=TOP/);
  await expect(cards).toHaveCount(25);
});

test("추가 조회 실패 후 자동 요청을 멈추고 수동 재시도로 복구한다", async ({
  page,
  request,
}) => {
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
  await page.locator('[class*="__loadMore"]').scrollIntoViewIfNeeded();
  const retry = page.getByRole("button", { name: "더 불러오기 다시 시도" });
  await expect(retry).toBeVisible({ timeout: 20000 });
  const failedAttempts = attempts;
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
  await expect(page.getByText("상품을 삭제하지 못했어요.")).toBeVisible();
  await expect(card).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
  fail = false;
  await remove.click();
  await expect(card).toHaveCount(0);
  await page.getByRole("button", { name: "완료", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "선택 완료 (0/2)" }),
  ).toBeVisible();
});

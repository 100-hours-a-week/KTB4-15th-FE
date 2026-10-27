import { test, expect } from "../fixtures/test";
import { apiURL } from "../data/chat";

test("최초 HTML에 랭킹을 포함하고 초기 중복 조회 없이 탭을 전환한다", async ({
  page,
}) => {
  const rankingRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith(`${apiURL}/products/rankings`)) {
      rankingRequests.push(request.url());
    }
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "test image unavailable" }),
  );
  const response = await page.goto("/ranking");
  const html = await response!.text();
  expect(html.match(/<article\b/g)).toHaveLength(12);
  expect(html).toMatch(
    /<link(?=[^>]*rel="preload")(?=[^>]*as="image")(?=[^>]*fetch[Pp]riority="high")[^>]*>/,
  );
  const rankingImages = (html.match(/<img\b[^>]*>/g) ?? []).filter((tag) =>
    tag.includes("ranking-row"),
  );
  expect(rankingImages.length).toBeGreaterThan(1);
  expect(rankingImages[0]).not.toContain('loading="lazy"');
  expect(rankingImages[0]).toMatch(/fetch[Pp]riority="high"/);
  for (const image of rankingImages.slice(1)) {
    expect(image).toContain('loading="lazy"');
    expect(image).not.toMatch(/fetch[Pp]riority="high"/);
  }
  await expect(page.locator("article")).toHaveCount(12);
  expect(rankingRequests).toEqual([]);
  await page.getByRole("button", { name: "조회순", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "조회순", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => rankingRequests.length).toBe(1);
  expect(rankingRequests[0]).toContain("type=CLICK");
  await page.getByRole("button", { name: "찜순", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(12);
  expect(rankingRequests).toHaveLength(1);
});

test("다른 세션도 랭킹을 재사용하되 매 요청 인증을 확인한다", async ({
  page,
  request,
}) => {
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "test image unavailable" }),
  );
  await page.goto("/ranking");
  await expect(page.locator("article")).toHaveCount(12);
  const before = (await (await request.get(`${apiURL}/__test/requests`)).json())
    .data.requests as { path: string }[];
  const beforeRanking = before.filter(
    (item) => item.path === "/products/rankings",
  ).length;
  const beforeAuth = before.filter(
    (item) => item.path === "/members/me",
  ).length;
  const response = await request.get("/ranking", {
    headers: { Cookie: "accessToken=another-test-session" },
  });
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toMatch(/<article[^>]*>/);
  const after = (await (await request.get(`${apiURL}/__test/requests`)).json())
    .data.requests as { path: string }[];
  expect(
    after.filter((item) => item.path === "/products/rankings"),
  ).toHaveLength(beforeRanking);
  expect(
    after.filter((item) => item.path === "/members/me").length,
  ).toBeGreaterThan(beforeAuth);
});

test("이미지 확대창을 클릭할 때 열고 닫기·Escape·재열기를 지원한다", async ({
  page,
  context,
}) => {
  const image =
    '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="72" height="72" fill="gray"/></svg>';
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: image }),
  );
  await context.route("https://img.29cm.co.kr/**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: image }),
  );
  await page.goto("/ranking");
  const trigger = page.getByRole("button", { name: /이미지 확대$/ }).first();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").locator("img")).toBeVisible();
  await page.getByRole("button", { name: "이미지 확대 화면 닫기" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("랭킹을 12개씩 추가 표시하고 추가 API 조회 없이 끝까지 보여준다", async ({
  page,
}) => {
  let rankingRequests = 0;
  await page.route(`${apiURL}/products/rankings?type=CLICK`, async (route) => {
    rankingRequests += 1;
    const response = await route.fetch();
    const body = await response.json();
    const product = body.data.items[0];
    body.data.items = Array.from({ length: 55 }, (_, index) => ({
      ...product,
      productId: 2000 + index,
      productImageUrl: "",
      rank: index + 1,
    }));
    await route.fulfill({ json: body });
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "test image unavailable" }),
  );
  await page.goto("/ranking");
  await page.getByRole("button", { name: "조회순", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(12);
  await page.locator("article").last().scrollIntoViewIfNeeded();
  await expect(page.locator("article")).toHaveCount(24);
  await page.locator("article").last().scrollIntoViewIfNeeded();
  await expect(page.locator("article")).toHaveCount(36);
  await page.getByRole("button", { name: "상품 더 보기" }).click();
  await expect(page.locator("article")).toHaveCount(48);
  await page.locator("article").last().scrollIntoViewIfNeeded();
  await expect(page.locator("article")).toHaveCount(55);
  await expect(page.getByRole("button", { name: "상품 더 보기" })).toHaveCount(
    0,
  );
  expect(rankingRequests).toBe(1);
  expect(await page.locator("article > strong").allTextContents()).toEqual(
    Array.from({ length: 55 }, (_, index) => String(index + 1)),
  );
  await page.getByRole("button", { name: "찜순", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(12);
  await page.getByRole("button", { name: "조회순", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(12);
});

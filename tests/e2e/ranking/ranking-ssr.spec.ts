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
  expect(html).toMatch(/<article[^>]*>/);
  await expect(page.locator("article")).toHaveCount(13);
  expect(rankingRequests).toEqual([]);
  await page.getByRole("button", { name: "조회순", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "조회순", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => rankingRequests.length).toBe(1);
  expect(rankingRequests[0]).toContain("type=CLICK");
  await page.getByRole("button", { name: "찜순", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(13);
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
  await expect(page.locator("article")).toHaveCount(13);
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

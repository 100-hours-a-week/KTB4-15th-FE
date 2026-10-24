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

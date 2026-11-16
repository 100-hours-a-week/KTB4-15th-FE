import { test, expect } from "../fixtures/test";
import { apiURL } from "../data/chat";

const photoUrl =
  "https://images.example.com/body-images/test-body.webp?X-Amz-Signature=test";
test.use({ scenario: { fullBodyImageUrl: photoUrl } });

test("전신 사진을 첫 HTML에 포함하고 중복 프로필 조회 없이 우선 로딩한다", async ({
  page,
}) => {
  const profileRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith(`${apiURL}/members/me/profile`)) {
      profileRequests.push(request.url());
    }
  });
  await page.route(photoUrl, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400"/>',
    }),
  );
  const response = await page.goto("/fitting");
  const html = await response!.text();
  const images = (html.match(/<img\b[^>]*>/g) ?? []).filter((tag) =>
    tag.includes("test-body.webp"),
  );
  expect(images).toHaveLength(1);
  for (const image of images) {
    expect(image).toContain('loading="eager"');
    expect(image).toMatch(/fetch[Pp]riority="high"/);
    expect(image).not.toContain("/_next/image");
    const src = image.match(/\ssrc="([^"]+)"/)![1].replaceAll("&amp;", "&");
    expect(src).toBe(photoUrl);
    expect(image).not.toMatch(/src[Ss]et=/);
  }
  await expect(page.getByRole("button", { name: "사진 변경" })).toBeVisible();
  expect(profileRequests).toEqual([]);
});

test("전신 사진 URL을 Next 이미지 최적화로 우회 요청할 수 없다", async ({
  request,
}) => {
  const source = new URL(photoUrl);
  source.pathname = "/body-images/test-body.webp";
  const response = await request.get("/_next/image", {
    params: { url: source.toString(), w: "640", q: "75" },
  });
  expect(response.status()).toBe(400);
});

test.describe("진행 중인 피팅이 있는 경우", () => {
  test.use({
    scenario: {
      generatingFitting: true,
      holdMemberProfile: true,
      fullBodyImageUrl: photoUrl,
    },
  });

  test("프로필 응답을 기다리지 않고 피팅 작업 화면으로 이동한다", async ({
    page,
    request,
  }) => {
    await page.route("**/fitting/jobs/123", (route) =>
      route.fulfill({ contentType: "text/html", body: "<p>피팅 작업</p>" }),
    );
    try {
      await page.goto("/fitting", { timeout: 15_000 });
      await expect(page).toHaveURL(/\/fitting\/jobs\/123$/);
      const { data } = await (
        await request.get(`${apiURL}/__test/requests`)
      ).json();
      expect(data.requests).toContainEqual({
        method: "GET",
        path: "/members/me/profile",
        body: null,
      });
    } finally {
      await request.post(`${apiURL}/__test/finish-profile`);
    }
  });
});

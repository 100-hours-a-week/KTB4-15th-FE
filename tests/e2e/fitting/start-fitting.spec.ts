import { test, expect } from "../fixtures/test";
import { products } from "../data/chat";

const photoUrl = "https://images.example.com/body-images/test.webp";

test.use({ scenario: { fullBodyImageUrl: photoUrl } });

for (const fails of [false, true]) {
  test(`lazy fitting request ${fails ? "keeps selection on failure" : "navigates and clears selection on success"}`, async ({
    page,
  }) => {
    await page.addInitScript((product) => {
      sessionStorage.setItem(
        "fitting-selection",
        JSON.stringify({
          state: { top: { ...product, fittingCandidateId: 1 }, bottom: null },
          version: 0,
        }),
      );
    }, products[0]);
    await page.route(photoUrl, (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
      }),
    );
    await page.route("**/fitting/jobs/123", (route) =>
      route.fulfill({ contentType: "text/html", body: "<p>Fitting job</p>" }),
    );
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    await page.route("**/fitting-jobs", async (route) => {
      calls++;
      expect(route.request().postDataJSON()).toEqual({
        topProductId: products[0].productId,
      });
      await gate;
      await route.fulfill({
        status: fails ? 429 : 200,
        json: fails
          ? {
              code: "FITTING_REQUEST_LIMIT_EXCEEDED",
              data: null,
              message: "limit",
            }
          : {
              code: "SUCCESS",
              data: { fittingJobId: 123, status: "GENERATING" },
              message: "ok",
            },
      });
    });
    await page.goto("/fitting");
    const button = page.getByRole("button", { name: "AI 가상 피팅 시작하기" });
    await expect(button).toBeEnabled();
    await button.click();
    try {
      await expect(button).toHaveAttribute("aria-busy", "true");
      await expect(button).toBeDisabled();
      await expect.poll(() => calls).toBe(1);
    } finally {
      release();
    }
    if (fails) {
      await expect(
        page.getByText(
          "오늘 가능한 가상 피팅 요청 횟수(최대 25회)를 모두 사용했어요.",
        ),
      ).toBeVisible();
      await expect(button).toBeEnabled();
      await expect(page.getByText(products[0].productName)).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/fitting\/jobs\/123$/);
      const selection = await page.evaluate(
        () => JSON.parse(sessionStorage.getItem("fitting-selection")!).state,
      );
      expect(selection).toEqual({ top: null, bottom: null });
    }
  });
}

import { test, expect } from "../fixtures/test";

for (const path of ["/fitting", "/profile/setup"]) {
  test.describe(path, () => {
    test.use({
      scenario: path === "/profile/setup" ? { memberStatus: "incomplete" } : {},
    });

    for (const status of [202, 429, 503]) {
      test(`warm-up ${status}에도 사진 선택·검증이 가능하고 한 번만 요청한다`, async ({
        page,
      }) => {
        let warmupCount = 0;
        await page.route("**/full-body-image/warmup", async (route) => {
          warmupCount += 1;
          expect(route.request().method()).toBe("POST");
          expect(route.request().postData()).toBeNull();
          await route.fulfill({
            status,
            json: { code: "TEST_WARMUP", data: null, message: "warmup" },
          });
        });
        await page.goto(path);
        expect(warmupCount).toBe(0);
        const button = page.getByRole("button", { name: /^사진 (변경|등록)$/ });
        const warmup = page.waitForResponse("**/full-body-image/warmup");
        const firstPicker = page.waitForEvent("filechooser");
        await button.click();
        await (await firstPicker).setFiles([]);
        await warmup;
        // setFiles([])는 네이티브 선택창의 cancel/focus 이벤트를 재현하지 않는다.
        await page.locator('input[type="file"]').dispatchEvent("cancel");
        await expect(
          page.getByText("사진 등록이 취소되었습니다."),
        ).toBeVisible();
        const secondPicker = page.waitForEvent("filechooser");
        await button.click();
        const validation = page.waitForRequest("**/full-body-image/validate");
        await (
          await secondPicker
        ).setFiles("public/images/profile/full-body-example.png");
        await validation;
        expect(warmupCount).toBe(1);
      });
    }

    test("warm-up 응답을 기다리지 않고 File Picker를 연다", async ({
      page,
    }) => {
      await page.route("**/full-body-image/warmup", () => {});
      await page.goto(path);
      const picker = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: /^사진 (변경|등록)$/ }).click();
      await picker;
    });
  });
}

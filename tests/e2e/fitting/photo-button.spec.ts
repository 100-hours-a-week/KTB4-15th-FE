import { test, expect } from "../fixtures/test";

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1280, height: 720 },
]) {
  test(`사진 버튼이 카드 안에 표시된다 (${viewport.width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/fitting");
    const section = page.getByRole("region", { name: "내 전신 사진" });
    const button = section.getByRole("button", { name: /사진 (변경|등록)/ });
    await expect(button).toBeVisible();
    await expect(button).toHaveCSS("position", "absolute");
    const card = (await section.locator("div").first().boundingBox())!;
    const box = (await button.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(card.x);
    expect(box.y).toBeGreaterThanOrEqual(card.y);
    expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width);
    expect(box.y + box.height).toBeLessThanOrEqual(card.y + card.height);
    const picker = page.waitForEvent("filechooser");
    await button.click();
    await picker;
  });
}

for (const cancelWith of ["Escape", "버튼"]) {
  test(`사진 검증을 ${cancelWith}(으)로 취소하고 같은 파일을 다시 선택할 수 있다`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    let validationCount = 0;
    await page.route("**/full-body-image/validate", async (route) => {
      validationCount += 1;
      if (validationCount === 1) return;
      await route.fulfill({
        json: { code: "TEST_INVALID_PHOTO", data: null, message: "" },
      });
    });
    await page.goto("/fitting");
    const button = page.getByRole("button", { name: /사진 (변경|등록)/ });
    const selectPhoto = async () => {
      const picker = page.waitForEvent("filechooser");
      await button.press("Enter");
      await (
        await picker
      ).setFiles("public/images/profile/full-body-example.png");
    };
    const validation = page.waitForRequest("**/full-body-image/validate");
    await selectPhoto();
    await validation;
    const dialog = page.getByRole("dialog", { name: /사진을 확인하고 있어요/ });
    const cancel = dialog.getByRole("button", { name: "사진 검증 취소" });
    await expect(cancel).toBeFocused();
    if (cancelWith === "Escape") await page.keyboard.press("Escape");
    else await cancel.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
    const photoSection = page.getByRole("region", { name: "내 전신 사진" });
    await expect(photoSection.getByRole("alert")).toHaveText(
      "사진 등록이 취소되었습니다.",
    );

    const retry = page.waitForResponse("**/full-body-image/validate");
    await selectPhoto();
    await retry;
    await expect(dialog).toBeHidden();
    expect(validationCount).toBe(2);
  });
}

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

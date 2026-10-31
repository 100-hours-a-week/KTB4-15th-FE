import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`landing scroll reveal at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 200 });
    await page.goto("/landing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "말하면 찾아주고",
    );
    await expect(page.locator("[data-fitting]")).toHaveCSS(
      "visibility",
      "hidden",
    );
    await expect(page.locator("[data-scene]").locator("xpath=..")).toHaveClass(
      /pin-spacer/,
    );
    await page.evaluate(() => window.scrollTo(0, 2650));
    await expect(page.locator("[data-garment]")).toHaveCSS(
      "visibility",
      "hidden",
    );
    await expect(page.locator("[data-result]")).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-result-details]")).toHaveCSS(
      "opacity",
      "1",
    );
    await expect(page.locator("[data-result] img")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("link", { name: "내 스타일 찾아보기" }),
    ).toHaveAttribute("href", "/onboarding");
    expect(
      await page
        .locator("[data-result] img")
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    ).toBe(true);
  });
}

test("reduced motion shows the result without pinning", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/landing");
  await expect(page.locator("[data-chat]")).toBeVisible();
  await expect(page.locator("[data-outro]")).toBeVisible();
  await expect(page.locator("[data-result]")).toBeVisible();
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
});

test("introduction moves horizontally and releases to the start link", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto("/landing");
  await expect(page.locator("[data-details]").locator("xpath=..")).toHaveClass(
    /pin-spacer/,
  );
  const section = page.locator("[data-details]");
  const top = await section.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  );
  await page.evaluate((y) => window.scrollTo(0, y), top);
  await page.mouse.move(195, 300);
  await page.mouse.wheel(0, 200);
  await expect(page.locator("[data-track]")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await page.mouse.wheel(0, 1500);
  await expect(section).toHaveCSS("position", "fixed");
  const slides = page.locator("[data-track] article");
  await expect
    .poll(() =>
      slides
        .nth(1)
        .evaluate((element) =>
          Math.abs(
            element.getBoundingClientRect().left -
              element.closest("[data-viewport]")!.getBoundingClientRect().left,
          ),
        ),
    )
    .toBeLessThan(2);
  for (const selector of ["[data-crown]"]) {
    await expect(page.locator(selector)).toHaveAttribute("style", /transform/);
    await expect(page.locator(selector)).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 0, 0)",
    );
  }
  const centeredX = await slides
    .nth(1)
    .evaluate((element) => element.getBoundingClientRect().left);
  await page.mouse.wheel(0, 200);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(top + 1850);
  await expect
    .poll(() =>
      slides.nth(1).evaluate((element) => element.getBoundingClientRect().left),
    )
    .toBeCloseTo(centeredX, 0);
  await page.evaluate((y) => window.scrollTo(0, y), top + 3400);
  await expect
    .poll(() =>
      slides
        .nth(2)
        .evaluate((element) =>
          Math.abs(
            element.getBoundingClientRect().left -
              element.closest("[data-viewport]")!.getBoundingClientRect().left,
          ),
        ),
    )
    .toBeLessThan(2);
  await expect(page.locator("[data-bell]")).toHaveAttribute(
    "style",
    /transform/,
  );
  await expect(page.locator("[data-bell]")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await page
    .getByRole("link", { name: "내 스타일 찾아보기" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("link", { name: "내 스타일 찾아보기" }),
  ).toBeInViewport();
});

test("chat recommendation leads into the same garment fitting", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/landing");
  await expect(page.getByText("주말 데이트 때 뭐 입을까?")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect(page.locator("[data-recommendation]")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-static-product]")).toBeVisible();
  const alignment = await page.locator("[data-garment]").evaluate((element) => {
    const garment = element.getBoundingClientRect();
    const product = document
      .querySelector("[data-product-visual]")!
      .getBoundingClientRect();
    return (
      Math.abs(garment.x + garment.width / 2 - product.x - product.width / 2) +
      Math.abs(garment.y + garment.height / 2 - product.y - product.height / 2)
    );
  });
  expect(alignment).toBeLessThan(2);

  await expect(page.locator("[data-fitting]")).toHaveCSS(
    "visibility",
    "hidden",
  );
  await expect(page.locator("[data-recommendation]")).toContainText(
    "포레스트 그린 니트",
  );
  await page.evaluate(() => window.scrollTo(0, 1700));
  await expect(page.locator("[data-processing]")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-result]")).toHaveCSS("opacity", "0");
  await expect(page.locator("[data-result-details]")).toHaveCSS("opacity", "0");
  await page.evaluate(() => window.scrollTo(0, 2650));
  await expect(page.locator("[data-chat]")).toHaveCSS("visibility", "hidden");
  await expect(page.locator("[data-result]")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-result-details]")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-result] img")).toBeVisible();
});

test("introduction animations only play on the first visit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/landing");
  const section = page.locator("[data-details]");
  await expect(section.locator("xpath=..")).toHaveClass(/pin-spacer/);
  const top = await section.evaluate(
    (element) => element.getBoundingClientRect().top + scrollY,
  );
  for (const [selector, offset] of [
    ["[data-crown]", 1700],
    ["[data-bell]", 3400],
  ] as const) {
    await page.evaluate((y) => scrollTo(0, y), top + offset);
    await expect
      .poll(
        () =>
          page
            .locator(selector)
            .evaluate((element) => getComputedStyle(element).transform),
        { intervals: [30, 50] },
      )
      .not.toBe("matrix(1, 0, 0, 1, 0, 0)");
    await expect(page.locator(selector)).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 0, 0)",
    );
  }
  await page.evaluate((y) => scrollTo(0, y), top - 100);
  await page.evaluate((y) => scrollTo(0, y), top + 1700);
  await page.waitForTimeout(250);
  await expect(page.locator("[data-crown]")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await expect(page.locator("[data-heart]")).toHaveCount(0);
});

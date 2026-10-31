import { expect, test } from "@playwright/test";

test("landing background and height follow the pinned feature", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("[data-details]").locator("xpath=..")).toHaveClass(
    /pin-spacer/,
  );
  await page.locator("[data-details]").evaluate((element) => {
    window.scrollTo(
      0,
      element.getBoundingClientRect().top + window.scrollY + 200,
    );
  });
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(240, 243, 236)",
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "rgb(240, 243, 236)",
  );
  await page.setViewportSize({ width: 390, height: 900 });
  await expect
    .poll(() =>
      page
        .locator("[data-details]")
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(900);
});

test("feature images become eager near the introduction", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-scene]").locator("xpath=..")).toHaveClass(
    /pin-spacer/,
  );
  const section = page.locator("[data-details]");
  const images = section.locator("img");
  await expect(images.first()).toHaveAttribute("loading", "lazy");
  const top = await section.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  );
  await page.evaluate(
    (top) => window.scrollTo(0, top - window.innerHeight - 300),
    top,
  );
  await expect(section.locator('img[loading="eager"]')).toHaveCount(
    await images.count(),
  );
});

for (const width of [390, 1440]) {
  test(`landing scroll reveal at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
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
      page.locator("section").getByRole("button", { name: "룩딱 시작하기" }),
    ).toBeEnabled();
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
  await page.goto("/");
  await expect(page.locator("[data-chat]")).toBeVisible();
  await expect(page.locator("[data-outro]")).toBeVisible();
  await expect(page.locator("[data-result]")).toBeVisible();
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
});

test("introduction moves horizontally and releases to the start link", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto("/");
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
    .locator("section")
    .getByRole("button", { name: "룩딱 시작하기" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.locator("section").getByRole("button", { name: "룩딱 시작하기" }),
  ).toBeInViewport();
});

test("chat recommendation leads into the same garment fitting", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByText("주말 데이트 때 뭐 입을까?")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect(page.locator("[data-recommendation]")).toHaveCSS("opacity", "1");
  const cardBottom = await page
    .locator("[data-recommendation]")
    .evaluate((element) => element.getBoundingClientRect().bottom);
  const composerTop = await page
    .locator("[data-chat] > div:last-child")
    .evaluate((element) => element.getBoundingClientRect().top);
  expect(cardBottom).toBeLessThanOrEqual(composerTop - 4);
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
  await page.evaluate(() => window.scrollTo(0, 1000));
  await expect(page.locator("[data-try-on-pending]")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-try-on-label]")).toHaveCSS(
    "visibility",
    "hidden",
  );
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect(page.locator("[data-try-on-label]")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-try-on-pending]")).toHaveCSS(
    "visibility",
    "hidden",
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
  await page.goto("/");
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

test("FAQ opens and closes with the keyboard", async ({ page }) => {
  await page.goto("/");
  const question = page
    .locator("summary")
    .filter({ hasText: "어떤 사진을 등록해야 하나요?" });
  await question.press("Enter");
  await expect(page.getByText(/혼자 정면을 바라보고/)).toBeVisible();
  await question.press("Enter");
  await expect(page.getByText(/혼자 정면을 바라보고/)).toBeHidden();
});

for (const viewport of [
  { width: 375, height: 667 },
  { width: 975, height: 800 },
  { width: 1440, height: 700 },
]) {
  test(`hero fits phone at ${viewport.width}x${viewport.height} and keeps fitting alignment`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const phone = page.locator("[data-phone]");
    await expect(page.locator("[data-scene]").locator("xpath=..")).toHaveClass(
      /pin-spacer/,
    );
    const sceneTop = await page
      .locator("[data-scene]")
      .evaluate(
        (element) => element.getBoundingClientRect().top + window.scrollY,
      );
    await page.evaluate((top) => window.scrollTo(0, top + 10), sceneTop);
    await expect(page.locator("[data-scene]")).toHaveCSS("position", "fixed");
    const bounds = await phone.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(bounds!.width).toBeGreaterThan(190);
    await page.evaluate(() => window.scrollTo(0, 1900));
    await page.waitForTimeout(1200);
    const garment = await page.locator("[data-garment]").boundingBox();
    const photo = await page.locator("[data-photo]").boundingBox();
    expect(Math.abs(garment!.x - photo!.x)).toBeLessThan(2);
    expect(Math.abs(garment!.y - photo!.y)).toBeLessThan(2);
    expect(Math.abs(garment!.width - photo!.width)).toBeLessThan(2);
  });
}

for (const value of [undefined, "false", "true"]) {
  test(`home shows landing regardless of old onboarding cookie ${value}`, async ({
    request,
  }) => {
    const response = await request.get("/", {
      headers: value
        ? { Cookie: `look-ddak-onboarding-completed=${value}` }
        : {},
      maxRedirects: 0,
    });
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("말하면 찾아주고");
  });
}

for (const path of ["/landing", "/onboarding"]) {
  test(`legacy ${path} redirects to home`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(new URL(response.headers().location, response.url()).pathname).toBe(
      "/",
    );
  });
}

for (const [memberStatus, destination] of [
  ["unauthenticated", "/signup"],
  ["incomplete", "/profile/setup"],
  ["complete", "/chat"],
] as const) {
  test(`landing start routes ${memberStatus} visitors to ${destination}`, async ({
    page,
    request,
  }) => {
    await request.post("http://127.0.0.1:3101/__test/reset", {
      data: {
        memberStatus,
        expiredRefresh: memberStatus === "unauthenticated",
      },
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "말하면 찾아주고",
    );
    await page
      .locator("header")
      .getByRole("button", { name: "룩딱 시작하기" })
      .click();
    await expect(page).toHaveURL(new RegExp(`${destination}(?:\\?|$)`));
  });
}

test("start refreshes an expired session before entering chat", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:3101/__test/reset", {
    data: { memberStatus: "refreshable" },
  });
  await page.goto("/");
  await page
    .locator("header")
    .getByRole("button", { name: "룩딱 시작하기" })
    .click();
  await expect(page).toHaveURL(/\/chat$/);
});

test("start stops after one refresh when membership stays unauthorized", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:3101/__test/reset", {
    data: { memberStatus: "unauthenticated" },
  });
  await page.goto("/");
  await page
    .locator("header")
    .getByRole("button", { name: "룩딱 시작하기" })
    .click();
  await expect(page).toHaveURL(/\/signup$/);
  const { data } = await (
    await request.get("http://127.0.0.1:3101/__test/requests")
  ).json();
  expect(
    data.requests.filter(
      (item: { path: string }) => item.path === "/auth/refresh",
    ),
  ).toHaveLength(1);
});

for (const failure of [400, 403, 500, "network"] as const) {
  test(`start falls back to login on ${failure}`, async ({ page }) => {
    await page.route("http://127.0.0.1:3101/members/me", (route) =>
      failure === "network"
        ? route.abort("failed")
        : route.fulfill({
            status: failure,
            json: { code: "TEST_FAILURE", data: null },
          }),
    );
    await page.goto("/");
    await page
      .locator("header")
      .getByRole("button", { name: "룩딱 시작하기" })
      .click();
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("start only checks membership on click and blocks duplicate clicks", async ({
  page,
}) => {
  let calls = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("http://127.0.0.1:3101/members/me", async (route) => {
    calls++;
    await pending;
    await route.fulfill({
      status: 401,
      json: { code: "UNAUTHORIZED", data: null },
    });
  });
  await page.route("**/bff/auth/refresh", (route) =>
    route.fulfill({ status: 401, json: { code: "UNAUTHORIZED", data: null } }),
  );
  await page.goto("/");
  await expect(page.locator("[data-scene]").locator("xpath=..")).toHaveClass(
    /pin-spacer/,
  );
  expect(calls).toBe(0);
  const button = page.locator("header").getByRole("button");
  await button.click();
  await expect(button).toBeDisabled();
  await expect(button).toHaveText("확인 중…");
  await expect.poll(() => calls).toBe(1);
  await button.evaluate((element: HTMLButtonElement) => element.click());
  expect(calls).toBe(1);
  release();
  await expect(page).toHaveURL(/\/signup$/);
});

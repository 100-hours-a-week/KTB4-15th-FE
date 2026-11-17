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
  test(`landing header links to login and signup at ${width}px`, async ({
    page,
    request,
  }) => {
    await request.post("http://127.0.0.1:3101/__test/reset", {
      data: { memberStatus: "unauthenticated" },
    });
    await page.setViewportSize({ width, height: 800 });
    const header = page.locator("header");

    for (const [name, destination] of [
      ["로그인", "/login?returnTo=%2Fchat"],
      ["회원가입", "/signup"],
    ]) {
      await page.goto("/");
      const link = header.getByRole("link", { name, exact: true });
      await expect(link).toBeInViewport({ ratio: 1 });
      await link.click();
      await expect(page).toHaveURL(new URL(destination, page.url()).href);
      await expect(
        page.getByText("로그인이 만료됐어요. 다시 로그인해 주세요."),
      ).toHaveCount(0);
    }
  });

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
      page.locator("section").getByRole("link", { name: "룩딱 시작하기" }),
    ).toHaveAttribute("href", "/signup");
    expect(
      await page
        .locator("[data-result] img")
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    ).toBe(true);
  });
}

test("landing login shows feedback while navigation is pending", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:3101/__test/reset", {
    data: { memberStatus: "unauthenticated" },
  });
  const navigation = Promise.withResolvers<void>();
  await page.route(
    (url) => url.pathname === "/chat",
    async (route) => {
      await navigation.promise;
      await route.continue();
    },
  );

  try {
    await page.goto("/");
    await expect(page.locator("[data-scene]").locator("xpath=..")).toHaveClass(
      /pin-spacer/,
    );
    const header = page.locator("header");
    await header.getByRole("link", { name: "로그인" }).click();
    await expect(header.getByRole("link", { name: "확인 중…" })).toBeVisible();
  } finally {
    navigation.resolve();
  }
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fchat$/);
});

for (const [memberStatus, expiredRefresh, destination] of [
  ["complete", false, /\/chat$/],
  ["refreshable", false, /\/chat$/],
  [
    "unauthenticated",
    true,
    /\/login\?returnTo=%2Fchat&reason=session-expired$/,
  ],
] as const) {
  test(`landing login handles a ${memberStatus} session`, async ({
    page,
    request,
    context,
  }) => {
    await request.post("http://127.0.0.1:3101/__test/reset", {
      data: { memberStatus, expiredRefresh },
    });
    await context.addCookies([
      {
        name: "refreshToken",
        value: "session",
        domain: "127.0.0.1",
        path: "/bff/auth",
      },
      ...(memberStatus === "complete"
        ? [
            {
              name: "accessToken",
              value: "active",
              domain: "127.0.0.1",
              path: "/",
            },
          ]
        : []),
    ]);

    await page.goto("/");
    await page.locator("header").getByRole("link", { name: "로그인" }).click();
    await expect(page).toHaveURL(destination);
    if (expiredRefresh) {
      await expect(page.getByLabel("비밀번호", { exact: true })).toBeVisible();
    }
  });
}

test("opens chat on the first click after access token expiry", async ({
  page,
  request,
  context,
}) => {
  await request.post("http://127.0.0.1:3101/__test/reset", {
    data: { memberStatus: "refreshable" },
  });
  await context.addCookies([
    { name: "accessToken", value: "refreshed", domain: "127.0.0.1", path: "/" },
    {
      name: "refreshToken",
      value: "session",
      domain: "127.0.0.1",
      path: "/bff/auth",
    },
  ]);
  await page.goto("/mypage");
  const chatLink = page.getByRole("link", { name: "채팅", exact: true });
  await expect(chatLink).toBeVisible();
  await context.clearCookies({ name: "accessToken" });
  const refresh = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/bff/auth/refresh" &&
      response.status() === 303 &&
      response.request().isNavigationRequest(),
  );
  await chatLink.click();
  await refresh;

  await expect(page).toHaveURL(/\/chat$/);
  await expect(
    page.getByRole("textbox", { name: "메시지, 최대 500자" }),
  ).toBeVisible();
});

test("reduced motion shows the result without pinning", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-chat]")).toBeVisible();
  await expect(page.locator("[data-outro]")).toBeVisible();
  await expect(page.locator("[data-result]")).toBeVisible();
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  const section = page.getByRole("region", {
    name: "룩딱 기능 소개",
    exact: true,
  });
  await expect(section).toHaveAttribute("data-details", "true");
  const layout = await section.evaluate((element) => {
    const sectionBounds = element.getBoundingClientRect();
    const lastSlide = element
      .querySelector("article:last-child")!
      .getBoundingClientRect();
    const faq = element.nextElementSibling!.getBoundingClientRect();
    return {
      bottom: sectionBounds.bottom,
      contentBottom: lastSlide.bottom,
      faqTop: faq.top,
    };
  });
  expect(layout.contentBottom).toBeLessThanOrEqual(layout.bottom);
  expect(layout.faqTop).toBeGreaterThanOrEqual(layout.bottom);
});

test("guest login resumes the requested service path and query", async ({
  page,
  request,
}) => {
  const mockApi = "http://127.0.0.1:3101";
  await request.post(`${mockApi}/__test/reset`, {
    data: { memberStatus: "unauthenticated" },
  });
  await page.route(`${mockApi}/auth/login`, async (route) => {
    await request.post(`${mockApi}/__test/scenario`, {
      data: { memberStatus: "complete" },
    });
    await route.fulfill({
      json: {
        code: "SUCCESS",
        message: "성공",
        data: { profileCompleted: true },
      },
    });
  });

  const destination = "/ranking?type=VIEW";
  await page.goto(destination);
  await expect(page).toHaveURL(
    new URL(
      `/login?${new URLSearchParams({ returnTo: destination })}`,
      page.url(),
    ).href,
  );
  await page.getByLabel("이메일", { exact: true }).fill("tester@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("TestPassword1!");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(new URL(destination, page.url()).href);
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
  await page.mouse.wheel(0, 800);
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
  await page.waitForTimeout(300);
  await page.mouse.wheel(0, 100);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(top + 950);
  await expect
    .poll(() =>
      slides.nth(1).evaluate((element) => element.getBoundingClientRect().left),
    )
    .toBeCloseTo(centeredX, 0);
  await page.evaluate((y) => window.scrollTo(0, y), top + 1900);
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
    .getByRole("link", { name: "룩딱 시작하기" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.locator("section").getByRole("link", { name: "룩딱 시작하기" }),
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
    ["[data-crown]", 1000],
    ["[data-bell]", 1900],
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
  await page.evaluate((y) => scrollTo(0, y), top + 1000);
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

test("home serves the landing without looking up a session cookie", async ({
  request,
}) => {
  const mockApi = "http://127.0.0.1:3101";
  await request.post(`${mockApi}/__test/reset`, {
    data: { memberStatus: "complete" },
  });
  const response = await request.get("/", {
    headers: { Cookie: "accessToken=active" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain("말하면 찾아주고");
  const { data } = await (
    await request.get(`${mockApi}/__test/requests`)
  ).json();
  expect(data.requests).toHaveLength(0);
});

for (const path of ["/landing", "/onboarding"]) {
  test(`legacy ${path} redirects to home`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(new URL(response.headers().location, response.url()).pathname).toBe(
      "/",
    );
  });
}

test("landing CTA links directly to signup", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "룩딱 시작하기" }).click();
  await expect(page).toHaveURL(/\/signup$/);
});

for (const width of [390, 1440]) {
  test(`feature transitions snap at halfway at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const section = page.locator("[data-details]");
    await expect(section.locator("xpath=..")).toHaveClass(/pin-spacer/);
    const top = await section.evaluate(
      (element) => element.getBoundingClientRect().top + scrollY,
    );
    for (const [offset, target] of [
      [640, 400],
      [650, 900],
      [660, 900],
      [1540, 1300],
      [1550, 1800],
      [1560, 1800],
      [1540, 1300],
      [640, 400],
      [200, 200],
      [2000, 2000],
    ]) {
      await page.evaluate((y) => scrollTo(0, y), top + offset);
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeCloseTo(top + target, 0);
      await expect
        .poll(() =>
          section.locator("[data-track]").evaluate((element) => {
            const x = new DOMMatrixReadOnly(getComputedStyle(element).transform)
              .m41;
            return Math.abs(
              x / element.parentElement!.clientWidth -
                Math.round(x / element.parentElement!.clientWidth),
            );
          }),
        )
        .toBeLessThan(0.001);
    }
  });
}

test("large wheel gestures advance one feature at a time", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const section = page.locator("[data-details]");
  await expect(section.locator("xpath=..")).toHaveClass(/pin-spacer/);
  const top = await section.evaluate(
    (element) => element.getBoundingClientRect().top + scrollY,
  );
  await page.evaluate((y) => scrollTo(0, y), top + 200);
  await expect(section).toHaveCSS("position", "fixed");
  for (const target of [900, 1800, 1300, 400]) {
    await page.mouse.wheel(0, target === 1300 || target === 400 ? -5000 : 5000);
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeCloseTo(top + target, 0);
    await page.mouse.wheel(0, target === 1300 || target === 400 ? -5000 : 5000);
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeCloseTo(top + target, 0);
    await page.waitForTimeout(300);
  }
  await page.mouse.wheel(0, -5000);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(top);
});

for (const direction of [1, -1]) {
  test(`large wheel entering features from ${direction > 0 ? "above" : "below"} cannot skip slides`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const section = page.getByRole("region", {
      name: "룩딱 기능 소개",
      exact: true,
    });
    await expect(section.locator("xpath=..")).toHaveClass(/pin-spacer/);
    const top = await section.evaluate(
      (element) => element.getBoundingClientRect().top + scrollY,
    );
    await page.evaluate(
      (y) => scrollTo(0, y),
      top + (direction > 0 ? -100 : 2300),
    );
    await expect(section).not.toHaveAttribute("data-pinned");
    await page.mouse.wheel(0, direction * 5000);
    const target = top + (direction > 0 ? 900 : 1300);
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeCloseTo(target, 0);
    await page.mouse.wheel(0, direction * 5000);
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeCloseTo(target, 0);
  });
}

test("기능 소개에서 방향키로 슬라이드를 바꾸고 Tab으로 빠져나간다", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("[data-details]");
  await expect(section.locator("xpath=..")).toHaveClass(/pin-spacer/);
  await section.evaluate((element) => {
    window.scrollTo(
      0,
      element.getBoundingClientRect().top + window.scrollY + 200,
    );
  });
  const viewport = page.getByRole("group", { name: "기능 소개 슬라이드" });
  await viewport.press("ArrowRight");
  const slide = viewport.locator("article").nth(1);
  await expect
    .poll(() =>
      slide.evaluate((element) =>
        Math.abs(
          element.getBoundingClientRect().left -
            element.closest("[data-viewport]")!.getBoundingClientRect().left,
        ),
      ),
    )
    .toBeLessThan(2);
  await page.keyboard.press("Tab");
  await expect(page.locator("summary").first()).toBeFocused();
});

import { test, expect } from "./fixtures/test";
import { apiURL, makeRoom, products } from "./data/chat";
import { recommend } from "./helpers/chat";

function contrast(first: string, second: string) {
  const luminance = (color: string) => {
    const channels = color.match(/\d+/g)!.slice(0, 3).map(Number);
    return channels.reduce((sum, channel, index) => {
      const value = channel / 255;
      const linear =
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => a - b);
  return (values[1] + 0.05) / (values[0] + 0.05);
}

test("보조 텍스트·Placeholder와 채팅 포커스는 AA 대비를 확보한다", async ({
  page,
}) => {
  await page.goto("/chat");
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-gray-600")
        .trim(),
    ),
  ).toBe("#6b7684");
  const colors = await page.evaluate(() => {
    const sample = document.createElement("span");
    document.body.append(sample);
    const resolve = (token: string) => {
      sample.style.color = `var(${token})`;
      return getComputedStyle(sample).color;
    };
    const values = [
      "--color-text-secondary",
      "--color-text-placeholder",
      "--color-background-surface",
      "--color-background-page",
      "--color-gray-100",
      "--color-green-100",
    ].map(resolve);
    sample.remove();
    return values;
  });
  for (const foreground of colors.slice(0, 2)) {
    for (const background of colors.slice(2)) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  }
  const input = page.getByRole("textbox");
  await input.focus();
  const border = await input.evaluate((element) => {
    const composer = element.closest("form")!;
    const style = getComputedStyle(composer);
    return [style.borderTopColor, style.backgroundColor];
  });
  expect(contrast(border[0], border[1])).toBeGreaterThanOrEqual(3);
});

test("스크롤로 숨겨진 메뉴는 포커스를 받는 즉시 표시된다", async ({ page }) => {
  await page.goto("/chat");
  const menu = page.getByRole("navigation", { name: "주요 메뉴" });
  await page.evaluate(() => {
    document.body.style.minHeight = "3000px";
  });
  await expect
    .poll(async () => {
      await page.evaluate(() => window.scrollBy(0, 50));
      return menu.evaluate((element) => element.getBoundingClientRect().top);
    })
    .toBeGreaterThanOrEqual(await page.evaluate(() => window.innerHeight));
  await menu.getByRole("link").first().focus();
  await page.keyboard.press("Tab");
  await expect(menu.getByRole("link").nth(1)).toBeFocused();
  await expect
    .poll(() =>
      menu.evaluate((element) => element.getBoundingClientRect().bottom),
    )
    .toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight));
});

test("프로필 사진 선택은 보이는 버튼에서 키보드로 실행한다", async ({
  page,
  request,
}) => {
  await request.post(`${apiURL}/__test/reset`, {
    data: { memberStatus: "incomplete" },
  });
  await page.goto("/profile/setup");
  await expect(page.locator('input[type="file"]')).toBeHidden();
  await page
    .getByRole("button", { name: "전신 사진 선택", exact: true })
    .focus();
  await page.keyboard.press("Tab");
  const upload = page.getByRole("button", { name: "사진 등록", exact: true });
  await expect(upload).toBeFocused();
  const chooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await chooser;
});

test("피팅 진행률은 이름과 현재 값을 제공한다", async ({ page }) => {
  await page.goto("/fitting/jobs/123");
  const progress = page.getByRole("progressbar", {
    name: "피팅 이미지 생성 진행률",
    exact: true,
  });
  await expect(progress).toBeVisible();
  await expect(progress).toHaveAttribute("aria-valuenow", /\d+/);
});

test("피팅 링크는 선택한 상품명을 포함하고 변경 링크 대비를 확보한다", async ({
  page,
  request,
}) => {
  for (const product of products) {
    await request.post(`${apiURL}/fitting-candidates`, {
      data: { productId: product.productId },
    });
  }
  await page.goto("/fitting/wardrobe");
  await page
    .getByRole("button", { name: new RegExp(products[0].productName) })
    .click();
  await page
    .getByRole("button", { name: "선택 완료 (1/2)", exact: true })
    .click();
  await expect(page).toHaveURL(/\/fitting$/);
  await expect(
    page.getByRole("link", { name: "피팅할 상의 선택하기" }),
  ).toHaveAccessibleName(`${products[0].productName}, 피팅할 상의 선택하기`);
  await expect(
    page.getByRole("link", { name: "피팅할 하의 선택하기" }),
  ).toHaveAccessibleName("선택 안 함, 피팅할 하의 선택하기");
  const colors = await page
    .getByRole("link", { name: "변경", exact: true })
    .evaluate((element) => {
      let parent: Element | null = element;
      while (
        parent &&
        getComputedStyle(parent).backgroundColor === "rgba(0, 0, 0, 0)"
      )
        parent = parent.parentElement;
      return [
        getComputedStyle(element).color,
        getComputedStyle(parent!).backgroundColor,
      ];
    });
  expect(contrast(colors[0], colors[1])).toBeGreaterThanOrEqual(4.5);
});

test("추천 상품 페이지는 작은 점을 유지하며 클릭 영역과 대비를 확보한다", async ({
  page,
  request,
}) => {
  await recommend(page, request);
  const second = page.getByRole("button", {
    name: "추천 상품 2 보기",
    exact: true,
  });
  const box = (await second.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
  const dot = second.locator("span");
  await expect(dot).toHaveCSS("width", "8px");
  await expect(dot).toHaveCSS("height", "8px");
  const colors = await dot.evaluate((element) => {
    let parent = element.parentElement;
    while (
      parent &&
      getComputedStyle(parent).backgroundColor === "rgba(0, 0, 0, 0)"
    )
      parent = parent.parentElement;
    return [
      getComputedStyle(element).backgroundColor,
      getComputedStyle(parent!).backgroundColor,
    ];
  });
  expect(contrast(colors[0], colors[1])).toBeGreaterThanOrEqual(3);
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
});

test("랜딩 영어 구절은 부분 언어를 제공한다", async ({ page }) => {
  await page.goto("/");
  for (const text of [
    "YOUR NEXT LOOK, LOOK DDAK",
    "MORE WAYS TO FIND YOUR STYLE.",
    "BEFORE YOU START",
    "01 / YOUR TASTE",
    "02 / TRENDING",
    "03 / STAY IN THE KNOW",
  ]) {
    await expect(page.getByText(text, { exact: true })).toHaveAttribute(
      "lang",
      "en",
    );
  }
});

const routeTitles = [
  ["/login", "로그인"],
  ["/signup", "회원가입"],
  ["/profile/setup", "기본 정보 입력"],
  ["/chat", "새 채팅"],
  ["/chat/1", "채팅 대화"],
  ["/chat/search", "대화 검색"],
  ["/fitting", "가상 피팅"],
  ["/fitting/wardrobe", "피팅 옷장"],
  ["/fitting/jobs/123", "가상 피팅 진행"],
  ["/fitting/jobs/123/result", "가상 피팅 결과"],
  ["/fitting-results", "저장한 가상 피팅"],
  ["/fitting-results/456", "저장한 가상 피팅 상세"],
  ["/mypage", "마이페이지"],
  ["/notifications", "알림"],
  ["/ranking", "상품 랭킹"],
  ["/wishlists", "찜 목록"],
  ["/not-existing", "페이지를 찾을 수 없음"],
  ["/chat/invalid", "페이지를 찾을 수 없음"],
];

for (const [route, title] of routeTitles) {
  test(`화면 목적을 문서 제목으로 구분한다: ${route}`, async ({
    page,
    request,
  }) => {
    await request.post(`${apiURL}/__test/reset`, {
      data: {
        memberStatus: route === "/profile/setup" ? "incomplete" : "complete",
        rooms: [makeRoom(1)],
      },
    });
    if (route === "/fitting-results/456") {
      await request.post(`${apiURL}/fitting-results`, {
        data: { fittingJobId: 123, outfitName: "접근성 검사 코디" },
      });
    }
    await page.goto(route);
    await expect(page).toHaveTitle(`${title} | LOOK DDAK`);
    await expect(page.locator("head title")).toHaveCount(1);
  });
}

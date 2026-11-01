import { test, expect } from "../fixtures/test";

const imageFile = {
  name: "body.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==",
    "base64",
  ),
};

test("첫 클릭으로 파일을 선택하고 지연 로딩 후 검증·저장·사진 갱신한다", async ({
  page,
}) => {
  let saved = false;
  let releaseValidation = () => {};
  const validationGate = new Promise<void>((resolve) => {
    releaseValidation = resolve;
  });
  const photoUrl =
    "https://lookddak-dev-images-686496667254-ap-northeast-2.s3.ap-northeast-2.amazonaws.com/body-images/changed.png";
  await page.route("**/members/me/profile", async (route) => {
    if (route.request().method() === "PATCH") {
      expect(route.request().postDataJSON()).toEqual({
        fullBodyImageValidationId: 42,
      });
      saved = true;
      await route.fulfill({
        json: { code: "SUCCESS", data: null, message: "성공" },
      });
      return;
    }
    await route.fulfill({
      json: {
        code: "SUCCESS",
        message: "성공",
        data: {
          email: "test@lookddak.com",
          name: "테스트",
          age: null,
          height: null,
          weight: null,
          priceAlertEnabled: true,
          fullBodyImageUrl: saved ? photoUrl : null,
        },
      },
    });
  });
  await page.route("**/full-body-image/validate", async (route) => {
    await validationGate;
    await route.fulfill({
      json: {
        code: "SUCCESS",
        message: "성공",
        data: {
          validationId: 42,
          fullBodyImageUrl: photoUrl,
        },
      },
    });
  });
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ path: "public/images/profile/full-body-example.png" }),
  );
  await page.goto("/fitting");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const picker = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /사진 (변경|등록)/ }).click();
  await (await picker).setFiles(imageFile);
  const dialog = page.getByRole("dialog", { name: /사진을 확인하고 있어요/ });
  try {
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
  } finally {
    releaseValidation();
  }
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "사진 변경" })).toBeEnabled();
  await expect(
    page.getByAltText("가상 피팅에 사용할 등록된 전신 사진"),
  ).toBeVisible();
  expect(saved).toBe(true);
});

test("잘못된 확장자는 검증 API 호출 없이 오류를 표시한다", async ({ page }) => {
  let validationRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/full-body-image/validate"))
      validationRequests++;
  });
  await page.goto("/fitting");
  const picker = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /사진 (변경|등록)/ }).click();
  await (
    await picker
  ).setFiles({ ...imageFile, name: "body.txt", mimeType: "text/plain" });
  await expect(
    page.getByRole("region", { name: "내 전신 사진" }).getByRole("alert"),
  ).toContainText("JPG, JPEG 또는 PNG");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(validationRequests).toBe(0);
});

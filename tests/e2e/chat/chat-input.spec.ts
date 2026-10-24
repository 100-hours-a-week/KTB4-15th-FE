import { test, expect } from "../fixtures/test";
import { input, finishReply } from "../helpers/chat";
import { writes } from "../helpers/mock-api";
import { makeRoom } from "../data/chat";

test("450자부터 글자 수를 표시하고 500자를 초과한 붙여넣기는 잘라서 전송한다", async ({
  page,
  request,
}) => {
  await page.goto("/chat");
  await input(page).fill("가".repeat(449));
  await expect(page.getByText("449/500", { exact: true })).toHaveCount(0);
  await input(page).press("End");
  await input(page).pressSequentially("가");
  await expect(page.getByText("450/500", { exact: true })).toBeVisible();
  await input(page).fill("가".repeat(501));
  await expect(input(page)).toHaveValue("가".repeat(500));
  await expect(page.getByText("500/500", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "메시지 전송", exact: true }).click();
  await finishReply(page, request);
  expect((await writes(request, "/chat-rooms"))[0].body.content).toHaveLength(
    500,
  );
});

test("Shift+Enter는 줄바꿈하고 Enter는 앞뒤 공백을 제거한 메시지를 전송한다", async ({
  page,
  request,
}) => {
  await page.goto("/chat");
  await input(page).fill("  첫 줄");
  await input(page).press("End");
  await input(page).press("Shift+Enter");
  await input(page).pressSequentially("둘째 줄  ");
  await expect(input(page)).toHaveValue("  첫 줄\n둘째 줄  ");
  expect(await writes(request, "/chat-rooms")).toHaveLength(0);
  await input(page).press("Enter");
  await finishReply(page, request);
  expect((await writes(request, "/chat-rooms"))[0].body.content).toBe(
    "첫 줄\n둘째 줄",
  );
});

test("한글 조합 중 Enter는 전송하지 않고 조합 종료 후 Enter로 전송한다", async ({
  page,
  request,
}) => {
  await page.goto("/chat");
  await input(page).fill("니트 추천");
  await input(page).dispatchEvent("keydown", {
    key: "Enter",
    code: "Enter",
    isComposing: true,
    bubbles: true,
  });
  await expect(input(page)).toHaveValue("니트 추천");
  expect(await writes(request, "/chat-rooms")).toHaveLength(0);
  await input(page).press("Enter");
  await finishReply(page, request);
  expect(await writes(request, "/chat-rooms")).toHaveLength(1);
});

test("여러 줄 입력은 버튼 위 전체 너비를 쓰고 화면 너비에 맞춰 높이가 바뀐다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat");
  const textarea = input(page);
  const button = page.getByRole("button", { name: "메시지 전송", exact: true });
  await textarea.fill("한 줄");
  const singleLine = (await textarea.boundingBox())!;
  for (let length = 2; length <= 60; length += 1) {
    await textarea.fill("가".repeat(length));
    if ((await textarea.boundingBox())!.width > singleLine.width) break;
  }
  const expandedWidth = (await textarea.boundingBox())!.width;
  expect(expandedWidth).toBeGreaterThan(singleLine.width);
  await textarea.press("End");
  await textarea.pressSequentially("가나다");
  expect((await textarea.boundingBox())!.width).toBe(expandedWidth);
  await textarea.fill("첫 줄\n둘째 줄");
  await expect(async () => {
    const box = (await textarea.boundingBox())!;
    const action = (await button.boundingBox())!;
    expect(box.width).toBeGreaterThan(singleLine.width);
    expect(box.height).toBeGreaterThan(singleLine.height);
    expect(action.y).toBeGreaterThanOrEqual(box.y + box.height);
  }).toPass();
  const multilineWidth = (await textarea.boundingBox())!.width;
  await textarea.press("End");
  await textarea.pressSequentially("계속 입력");
  expect((await textarea.boundingBox())!.width).toBe(multilineWidth);
  await textarea.fill("가".repeat(500));
  await expect(page.getByText("500/500", { exact: true })).toBeVisible();
  const full = (await textarea.boundingBox())!;
  const scrollArea = await textarea.evaluate((element) => ({
    paddingRight: parseFloat(getComputedStyle(element).paddingRight),
    scrollbarWidth: getComputedStyle(element, "::-webkit-scrollbar").width,
    scrollbarGutter: getComputedStyle(element).scrollbarGutter,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  expect(scrollArea.paddingRight).toBeGreaterThanOrEqual(8);
  expect(scrollArea.scrollbarWidth).toBe("6px");
  expect(scrollArea.scrollbarGutter).toBe("stable");
  expect(scrollArea.scrollHeight).toBeGreaterThan(scrollArea.clientHeight);
  expect((await button.boundingBox())!.y).toBeGreaterThanOrEqual(
    full.y + full.height,
  );
  expect(full.width).toBe(multilineWidth);
  await textarea.fill("가".repeat(50));
  const narrowHeight = (await textarea.boundingBox())!.height;
  await page.setViewportSize({ width: 1280, height: 844 });
  await expect(async () => {
    expect((await textarea.boundingBox())!.height).toBeLessThan(narrowHeight);
  }).toPass();
  await textarea.fill("한 줄");
  await expect(async () => {
    expect((await textarea.boundingBox())!.height).toBe(singleLine.height);
  }).toPass();
});

test.describe("입력창 하단 여백", () => {
  test.use({ scenario: { rooms: [makeRoom(1)] } });

  for (const path of ["/chat", "/chat/1"]) {
    test(`${path}에서 입력창 높이만큼 여백을 확보하고 마지막 내용을 가리지 않는다`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      const textarea = input(page);
      const main = page.getByRole("main");
      const initialPadding = await main.evaluate((element) =>
        parseFloat(getComputedStyle(element).paddingBottom),
      );
      await textarea.fill("가".repeat(500));
      await expect(async () => {
        const box = (await textarea.boundingBox())!;
        expect(box.height).toBe(96);
        const padding = await main.evaluate((element) =>
          parseFloat(getComputedStyle(element).paddingBottom),
        );
        expect(padding).toBeGreaterThan(initialPadding);
      }).toPass();
      await page.evaluate(() =>
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "instant",
        }),
      );
      const content =
        path === "/chat/1"
          ? page.getByRole("log").getByRole("article").last()
          : page.getByRole("button", { name: /데일리 출근용/ });
      await expect(async () => {
        const bottom = (await content.boundingBox())!;
        const dockTop = await textarea.evaluate(
          (element) =>
            element
              .closest("form")!
              .parentElement!.parentElement!.getBoundingClientRect().top,
        );
        expect(bottom.y + bottom.height).toBeLessThanOrEqual(dockTop);
      }).toPass();
      await textarea.fill("");
      await expect(async () => {
        const padding = await main.evaluate((element) =>
          parseFloat(getComputedStyle(element).paddingBottom),
        );
        expect(padding).toBe(initialPadding);
      }).toPass();
    });
  }
});

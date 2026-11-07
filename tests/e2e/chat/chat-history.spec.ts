import type { ChatMessageResponse } from "../../../src/features/chat/schema/chat";
import { test, expect } from "../fixtures/test";
import { configure } from "../helpers/mock-api";
import { apiURL, createdAt, makeRoom } from "../data/chat";

const history: ChatMessageResponse[] = Array.from(
  { length: 24 },
  (_, index) => ({
    messageId: index + 1,
    content: `이전 대화 ${String(index + 1).padStart(2, "0")}`,
    createdAt,
    senderType: "AI",
    generationStatus: null,
    recommendation: null,
  }),
);

test.use({ scenario: { rooms: [{ ...makeRoom(1), messages: history }] } });

test("최근 20개 이후 이전 대화를 중복 없이 시간 순서로 추가한다", async ({
  page,
}) => {
  await page.goto("/chat/1");
  const log = page.getByRole("log", { name: "채팅 메시지" });
  await expect(log.getByRole("article")).toHaveCount(20);
  await page
    .getByText("이전 대화 24", { exact: true })
    .scrollIntoViewIfNeeded();
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, -10000);
      return log.getByRole("article").count();
    })
    .toBe(24);
  const contents = await log.getByRole("article").allTextContents();
  contents.forEach((text, index) =>
    expect(text).toContain(history[index].content),
  );
});

test("이전 대화 조회 실패는 현재 대화를 유지하고 안내한 뒤 재시도할 수 있다", async ({
  page,
  request,
}) => {
  await configure(request, { failHistory: true });
  await page.goto("/chat/1");
  await page
    .getByText("이전 대화 24", { exact: true })
    .scrollIntoViewIfNeeded();
  let requests = 0;
  page.on("request", (req) => {
    if (
      req.url().startsWith(`${apiURL}/chat-rooms/1/messages?`) &&
      new URL(req.url()).searchParams.has("before")
    )
      requests += 1;
  });
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, -10000);
      return requests > 0;
    })
    .toBeTruthy();
  const notice = page.getByText(
    "이전 메시지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    { exact: true },
  );
  await expect(notice).toBeVisible();
  await expect(notice).toHaveCSS("white-space", "pre-line");
  await expect(notice).toHaveText(
    "이전 메시지를 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.",
    { useInnerText: true },
  );
  expect(requests).toBe(3);
  await expect(notice).toBeInViewport({ ratio: 1 });
  const screenshotPath = test
    .info()
    .outputPath("previous-messages-error-toast.png");
  await page.screenshot({ path: screenshotPath });
  await test.info().attach("이전 메시지 조회 실패 토스트", {
    path: screenshotPath,
    contentType: "image/png",
  });
  await expect(page.getByRole("log").getByRole("article")).toHaveCount(20);
  await configure(request, { failHistory: false });
  await page.mouse.wheel(0, 10000);
  await expect(
    page.getByText("이전 대화 24", { exact: true }),
  ).toBeInViewport();
  await page.mouse.wheel(0, -10000);
  await expect(page.getByRole("log").getByRole("article")).toHaveCount(24);
});

test.describe("검색 결과의 채팅 문맥", () => {
  const roomHistory: ChatMessageResponse[] = Array.from(
    { length: 65 },
    (_, index) => ({
      ...history[0],
      messageId: 350 + index,
      content:
        index === 31 ? "반바지로 알아봐줘." : `문맥 메시지 ${350 + index}`,
    }),
  );

  test.use({
    scenario: { rooms: [{ ...makeRoom(25), messages: roomHistory }] },
  });

  test("검색 위치에서 시작해 과거와 최신 내역을 각각 이어 붙인다", async ({
    page,
  }) => {
    await page.route(
      (url) => url.pathname === "/chat/25" && url.searchParams.has("_rsc"),
      async (route) => {
        const response = await route.fetch();
        // Let the search debounce finish while the destination is loading.
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({ response });
      },
    );
    const searchRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith("/chat-rooms/search")) {
        searchRequests.push(request.url());
      }
    });
    await page.goto("/chat/search?keyword=반바지");
    await page.getByRole("link", { name: /반바지로 알아봐줘/ }).click();
    await expect(page).toHaveURL(
      `/chat/25?messageId=381&keyword=${encodeURIComponent("반바지")}`,
    );
    const log = page.getByRole("log", { name: "채팅 메시지" });
    await expect(log.getByText("반바지로 알아봐줘.")).toBeInViewport();
    await expect(log.getByRole("article")).toHaveCount(41);

    await page.mouse.wheel(0, -10000);
    await expect(log.getByText("문맥 메시지 350", { exact: true })).toHaveCount(
      1,
    );
    await expect(log.getByText("문맥 메시지 414", { exact: true })).toHaveCount(
      0,
    );

    await page.mouse.wheel(0, 10000);
    await expect(log.getByText("문맥 메시지 414", { exact: true })).toHaveCount(
      1,
    );
    const contents = await log.getByRole("article").allTextContents();
    expect(contents).toHaveLength(roomHistory.length);
    contents.forEach((text, index) =>
      expect(text).toContain(roomHistory[index].content),
    );

    const target = log.getByText("반바지로 알아봐줘.");
    await expect(target).not.toBeInViewport();
    await page.goBack();
    await page.getByRole("link", { name: /반바지로 알아봐줘/ }).click();
    await expect(page).toHaveURL(
      `/chat/25?messageId=381&keyword=${encodeURIComponent("반바지")}`,
    );
    await expect(target).toBeInViewport();
    await expect(log.locator("mark")).toHaveText(["반바지"]);
    expect(searchRequests).toHaveLength(1);
  });
});

test("이전 내역 응답을 기다리며 이동한 스크롤 위치를 유지한다", async ({
  page,
}) => {
  let releaseResponse: (() => void) | undefined;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  let requested: (() => void) | undefined;
  const requestStarted = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route(
    (url) =>
      url.pathname.endsWith("/chat-rooms/1/messages") &&
      url.searchParams.has("before"),
    async (route) => {
      const response = await route.fetch();
      requested?.();
      await responseGate;
      await route.fulfill({ response });
    },
  );
  await page.goto("/chat/1");
  await expect(page.getByRole("log").getByRole("article")).toHaveCount(20);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await requestStarted;
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }));
  const anchor = page.locator('[data-message-id="10"]');
  const before = (await anchor.boundingBox())!.y;
  releaseResponse?.();
  await expect(page.getByRole("log").getByRole("article")).toHaveCount(24);
  await expect
    .poll(async () => Math.abs((await anchor.boundingBox())!.y - before))
    .toBeLessThan(3);
});

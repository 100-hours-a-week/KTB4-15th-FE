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
      req.url().startsWith(`${apiURL}/chat-rooms/1?`) &&
      new URL(req.url()).searchParams.has("cursor")
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
  expect(requests).toBe(2);
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
  await page
    .getByText("이전 대화 24", { exact: true })
    .scrollIntoViewIfNeeded();
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, -10000);
      return page.getByRole("log").getByRole("article").count();
    })
    .toBe(24);
  await expect(page.getByRole("log").getByRole("article")).toHaveCount(24);
});

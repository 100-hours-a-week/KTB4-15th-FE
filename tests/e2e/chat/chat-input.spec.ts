import { test, expect } from "../fixtures/test";
import { input, finishReply, writes } from "../fixtures/chat-actions";

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

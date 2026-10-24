import { test, expect } from "../fixtures/test";
import { apiURL, message, partialReply, reply } from "../data/chat";
import { input, productCard, finishReply, recommend } from "../helpers/chat";
import { writes } from "../helpers/mock-api";

test("메시지를 보내 답변과 추천 상품을 받고 새로고침해도 대화가 유지된다", async ({
  page,
  request,
}) => {
  await recommend(page, request);
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(page.getByText(reply, { exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: /^추천 상품/ })).toHaveCount(
    2,
  );
  await expect(productCard(page)).toContainText("49,000원");
  expect(await writes(request, "/chat-rooms")).toEqual([
    {
      method: "POST",
      path: "/chat-rooms",
      body: { content: message, sourceType: "GENERAL" },
    },
  ]);
  await page.reload();
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(page.getByText(reply, { exact: true })).toBeVisible();
  await expect(productCard(page)).toBeVisible();
});

test("기존 채팅방에서 후속 메시지를 보내 새 답변을 받는다", async ({
  page,
  request,
}) => {
  await recommend(page, request);
  const followUp = "비슷한 상품도 추천해줘";
  await input(page).fill(followUp);
  await input(page).press("Enter");
  await expect(page.getByText(followUp, { exact: true })).toBeVisible();
  await expect(page.getByText(partialReply, { exact: true })).toBeVisible();
  expect(
    (await request.post(`${apiURL}/__test/finish-stream`)).ok(),
  ).toBeTruthy();
  await expect(page.getByText(reply, { exact: true })).toHaveCount(2);
  await expect(input(page)).toBeEnabled();
  expect(await writes(request, "/chat-rooms/1/messages")).toEqual([
    {
      method: "POST",
      path: "/chat-rooms/1/messages",
      body: { content: followUp },
    },
  ]);
});

test("공백 메시지는 전송하지 않고 전송 중 연속 클릭은 채팅방을 중복 생성하지 않는다", async ({
  page,
  request,
}) => {
  await page.goto("/chat");
  await input(page).fill("   ");
  await expect(
    page.getByRole("button", { name: "메시지 전송", exact: true }),
  ).toBeDisabled();
  await input(page).press("Enter");
  expect(await writes(request, "/chat-rooms")).toHaveLength(0);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let submissions = 0;
  await page.route(`${apiURL}/chat-rooms`, async (route) => {
    if (route.request().method() === "POST") {
      submissions++;
      await gate;
    }
    await route.continue();
  });
  await input(page).fill(message);
  try {
    await page
      .getByRole("button", { name: "메시지 전송", exact: true })
      .dblclick();
    await expect(input(page)).toBeDisabled();
    await expect.poll(() => submissions).toBe(1);
  } finally {
    release();
  }
  await finishReply(page, request);
  expect(await writes(request, "/chat-rooms")).toHaveLength(1);
});

test.describe("새 채팅 전송 실패", () => {
  test.use({ scenario: { failCreate: true } });
  test("입력 내용을 유지하고 다시 전송할 수 있다", async ({
    page,
    request,
  }) => {
    await page.goto("/chat");
    await input(page).fill(message);
    await page
      .getByRole("button", { name: "메시지 전송", exact: true })
      .click();
    await expect(
      page.getByText("메시지를 보내지 못했어요. 다시 시도해 주세요.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/chat$/);
    await expect(input(page)).toHaveValue(message);
    await expect(
      page.getByRole("button", { name: "메시지 전송", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "메시지 전송", exact: true })
      .click();
    await finishReply(page, request);
    expect(await writes(request, "/chat-rooms")).toHaveLength(2);
  });
});

test.describe("기존 채팅 전송 실패", () => {
  test.use({ scenario: { failMessage: true } });
  test("기존 대화를 유지하고 입력한 후속 메시지를 다시 전송할 수 있다", async ({
    page,
    request,
  }) => {
    await recommend(page, request);
    const followUp = "다른 색상도 추천해줘";
    await input(page).fill(followUp);
    await input(page).press("Enter");
    await expect(
      page.getByText("메시지를 보내지 못했어요. 다시 시도해 주세요.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(input(page)).toHaveValue(followUp);
    await expect(page.getByText(reply, { exact: true })).toBeVisible();
    await input(page).press("Enter");
    await expect(page.getByText(partialReply, { exact: true })).toBeVisible();
    expect(
      (await request.post(`${apiURL}/__test/finish-stream`)).ok(),
    ).toBeTruthy();
    await expect(page.getByText(reply, { exact: true })).toHaveCount(2);
    await expect(input(page)).toBeEnabled();
  });
});

for (const streamFailure of ["error", "disconnect"] as const) {
  test.describe(`스트림 ${streamFailure}`, () => {
    test.use({ scenario: { streamFailure } });
    test("완료 전 오류를 알리고 추천 성공으로 표시하지 않으며 재시도가 가능하다", async ({
      page,
      request,
    }) => {
      await page.goto("/chat");
      await input(page).fill(message);
      await input(page).press("Enter");
      await expect(page.getByText(partialReply, { exact: true })).toBeVisible();
      expect(
        (await request.post(`${apiURL}/__test/finish-stream`)).ok(),
      ).toBeTruthy();
      await expect(
        page.getByText(
          streamFailure === "error"
            ? "AI 응답을 완료하지 못했어요."
            : "AI 응답 연결이 완료 이벤트 없이 종료되었습니다.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("article", { name: /^추천 상품/ }),
      ).toHaveCount(0);
      await expect(input(page)).toBeEnabled();
      await page
        .getByRole("button", { name: "다시 시도", exact: true })
        .click();
      await finishReply(page, request);
      await expect(page.getByText(reply, { exact: true })).toBeVisible();
    });
  });
}

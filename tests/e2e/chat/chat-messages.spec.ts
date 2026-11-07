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

test("SSE 단절 후 생성 중이면 재연결하고 내역 전체를 재조회하지 않는다", async ({
  page,
  request,
}) => {
  let connections = 0;
  const historyRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/chat-rooms\/1\/messages\?/.test(request.url()))
      historyRequests.push(request.url());
  });
  await page.route("**/messages/*/stream", (route) => {
    connections++;
    if (connections > 1) return route.fallback();
    return route.fulfill({ contentType: "text/event-stream", body: "" });
  });
  await page.goto("/chat");
  await input(page).fill(message);
  await input(page).press("Enter");
  await expect.poll(() => connections).toBe(2);
  const before = historyRequests.length;
  await finishReply(page, request);
  expect(historyRequests).toHaveLength(before);
  await expect(page.getByText(reply, { exact: true })).toHaveCount(1);
});

test("SSE 단절 후 완료 상태이면 해당 답변만 캐시에 반영한다", async ({
  page,
}) => {
  const historyRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/chat-rooms\/1\/messages\?/.test(request.url()))
      historyRequests.push(request.url());
  });
  await page.route("**/messages/*/stream", (route) =>
    route.fulfill({ contentType: "text/event-stream", body: "" }),
  );
  await page.route("**/messages/*/status", (route) =>
    route.fulfill({
      json: {
        code: "OK",
        message: "성공",
        data: {
          generationStatus: "COMPLETED",
          message: {
            messageId: 2,
            senderType: "AI",
            content: reply,
            generationStatus: null,
            recommendation: null,
            createdAt: "2026-10-24T09:00:00",
          },
        },
      },
    }),
  );
  await page.goto("/chat");
  await input(page).fill(message);
  await input(page).press("Enter");
  await expect(page.getByText(reply, { exact: true })).toHaveCount(1);
  await expect(input(page)).toBeEnabled();
  expect(historyRequests).toHaveLength(1);
});

test("상태 조회 실패 후 같은 답변의 연결을 다시 시도할 수 있다", async ({
  page,
  request,
}) => {
  let streamRequests = 0;
  let statusRequests = 0;
  await page.route("**/messages/*/stream", (route) => {
    streamRequests++;
    return route.fulfill({ contentType: "text/event-stream", body: "" });
  });
  await page.route("**/messages/*/status", (route) => {
    statusRequests++;
    if (statusRequests === 1) return route.fulfill({ status: 400 });
    return route.fulfill({
      json: {
        code: "OK",
        message: "성공",
        data: {
          generationStatus: "COMPLETED",
          message: {
            messageId: 2,
            senderType: "AI",
            content: reply,
            generationStatus: null,
            recommendation: null,
            createdAt: "2026-10-24T09:00:00",
          },
        },
      },
    });
  });

  await page.goto("/chat");
  await input(page).fill(message);
  await input(page).press("Enter");
  await expect(
    page.getByText("답변 상태를 확인하지 못했어요. 연결을 다시 시도해 주세요."),
  ).toBeVisible();
  const retry = page.getByRole("button", { name: "답변 연결 다시 시도" });
  await expect(retry).toBeVisible();
  await expect(input(page)).toBeDisabled();

  await retry.click();
  await expect(page.getByText(reply, { exact: true })).toHaveCount(1);
  await expect(input(page)).toBeEnabled();
  await expect(retry).toHaveCount(0);
  expect(streamRequests).toBe(1);
  expect(statusRequests).toBe(2);
  expect(await writes(request, "/chat-rooms")).toHaveLength(1);
  expect(await writes(request, "/chat-rooms/1/messages")).toHaveLength(0);
});

test("늦게 도착한 내역 응답이 status의 완료 결과를 덮어쓰지 않는다", async ({
  page,
}) => {
  let releaseStatus!: () => void;
  const statusGate = new Promise<void>((resolve) => {
    releaseStatus = resolve;
  });
  let releaseHistory!: () => void;
  const historyGate = new Promise<void>((resolve) => {
    releaseHistory = resolve;
  });
  let historyStarted!: () => void;
  const historyPending = new Promise<void>((resolve) => {
    historyStarted = resolve;
  });
  let lateResponseFinished!: () => void;
  const lateResponse = new Promise<void>((resolve) => {
    lateResponseFinished = resolve;
  });
  let historyRequests = 0;
  let streamRequests = 0;
  let lateRequestUrl = "";

  await page.route("**/chat-rooms/1/messages?*", async (route) => {
    const response = await route.fetch();
    if (++historyRequests === 1) return route.fulfill({ response });
    const staleBody = await response.json();
    expect(staleBody.data.messages[0].generationStatus).toBe("PENDING");
    lateRequestUrl = route.request().url();
    historyStarted();
    await historyGate;
    await route.fulfill({ response, json: staleBody });
    lateResponseFinished();
  });
  await page.route("**/messages/*/stream", (route) => {
    streamRequests++;
    return route.fulfill({ contentType: "text/event-stream", body: "" });
  });
  await page.route("**/messages/*/status", async (route) => {
    await statusGate;
    await route.fulfill({
      json: {
        code: "OK",
        message: "성공",
        data: {
          generationStatus: "COMPLETED",
          message: {
            messageId: 2,
            senderType: "AI",
            content: reply,
            generationStatus: null,
            recommendation: null,
            createdAt: "2026-10-24T09:00:00",
          },
        },
      },
    });
  });

  try {
    await page.goto("/chat");
    await input(page).fill(message);
    await input(page).press("Enter");
    await expect(page).toHaveURL(/\/chat\/1$/);
    await expect(
      page.getByRole("log").getByText(message, { exact: true }),
    ).toBeVisible();

    await page.evaluate(() => {
      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(new Event("online"));
    });
    await expect.poll(() => historyRequests).toBe(2);
    await historyPending;
    releaseStatus();
    await expect(page.getByText(reply, { exact: true })).toHaveCount(1);
    await expect(input(page)).toBeEnabled();
    const delivered = page.waitForResponse(
      (response) => response.url() === lateRequestUrl,
    );
    releaseHistory();
    await lateResponse;
    await (await delivered).finished();
    // Flush the delivered response and the resulting render before checking it.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(page.getByText(reply, { exact: true })).toHaveCount(1);
    await expect(input(page)).toBeEnabled();
    expect(historyRequests).toBe(2);
    expect(streamRequests).toBe(1);
  } finally {
    releaseStatus();
    releaseHistory();
  }
});

import { test, expect } from "../fixtures/test";
import {
  apiURL,
  makeRoom,
  message,
  partialReply,
  reply,
} from "../fixtures/chat-data";
import { input, configure, finishReply } from "../fixtures/chat-actions";

for (const invalidId of ["0", "-1", "abc", "1.5"]) {
  test(`유효하지 않은 채팅 ID ${invalidId}는 Not Found를 표시한다`, async ({
    page,
  }) => {
    await page.goto(`/chat/${invalidId}`);
    await expect(
      page.getByRole("heading", { name: "페이지를 찾을 수 없어요" }),
    ).toBeVisible();
  });
}

for (const deniedRoom of [false, true]) {
  test.describe(deniedRoom ? "접근 불가 방" : "존재하지 않는 방", () => {
    test.use({ scenario: { deniedRoom } });
    test("조회 불가를 안내하고 채팅 홈으로 돌아간다", async ({ page }) => {
      await page.goto("/chat/999");
      await expect(
        page.getByText("존재하지 않거나 접근할 수 없는 채팅방이에요.", {
          exact: true,
        }),
      ).toBeVisible();
      await page.getByRole("button", { name: "채팅 홈으로 이동" }).click();
      await expect(page).toHaveURL(/\/chat$/);
    });
  });
}

test.describe("대화 조회 실패", () => {
  test.use({ scenario: { rooms: [makeRoom(1)], failRoomDetail: true } });
  test("초기 조회 실패 후 재시도하면 대화와 입력창을 복구한다", async ({
    page,
    request,
  }) => {
    await page.goto("/chat/1");
    await expect(
      page.getByRole("heading", { name: "채팅방을 확인하지 못했어요" }),
    ).toBeVisible();
    await expect(input(page)).toHaveCount(0);
    await configure(request, { failRoomDetail: false });
    await page.getByRole("button", { name: "다시 시도", exact: true }).click();
    await expect(page.getByText("답변 1", { exact: true })).toBeVisible();
    await expect(input(page)).toBeEnabled();
  });
});

test.describe("추천 상품 없는 답변", () => {
  test.use({ scenario: { noProducts: true } });
  test("답변은 완료하고 빈 추천 영역 없이 후속 입력을 허용한다", async ({
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
    await expect(page.getByText(reply, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "AI 추천 상품" }),
    ).toHaveCount(0);
    await expect(input(page)).toBeEnabled();
  });
});

test.describe("스트림 Snapshot", () => {
  test.use({ scenario: { snapshot: true } });
  test("복원된 답변에 후속 Token을 이어 붙여 완료한다", async ({
    page,
    request,
  }) => {
    await page.goto("/chat");
    await input(page).fill(message);
    await input(page).press("Enter");
    await finishReply(page, request);
    await expect(page.getByText(reply, { exact: true })).toBeVisible();
  });
});

for (const streamFailure of ["mismatch", "malformed"] as const) {
  test.describe(`잘못된 스트림 ${streamFailure}`, () => {
    test.use({ scenario: { streamFailure } });
    test("잘못된 이벤트를 성공 처리하지 않고 잠금을 해제한다", async ({
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
      await expect(input(page)).toBeEnabled();
      await expect(
        page.getByRole("article", { name: /^추천 상품/ }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "다시 시도", exact: true }),
      ).toBeVisible();
      await expect(page.getByText("다른 메시지", { exact: true })).toHaveCount(
        0,
      );
    });
  });
}

test("답변 생성 중 새 채팅으로 이동해도 이전 방의 내용이 섞이지 않는다", async ({
  page,
}) => {
  await page.goto("/chat");
  await input(page).fill(message);
  await input(page).press("Enter");
  await expect(page.getByText(partialReply, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "대화 목록 열기" }).click();
  await page.getByRole("button", { name: "새 채팅", exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(input(page)).toBeEnabled();
  await expect(page.getByText(partialReply, { exact: true })).toHaveCount(0);
});

test.describe("채팅방 한도 초과", () => {
  test.use({ scenario: { rooms: [makeRoom(1)], roomLimit: true } });
  test("한도를 안내하고 메시지 입력을 유지한다", async ({ page }) => {
    await page.goto("/chat/1");
    await input(page).fill(message);
    await input(page).press("Enter");
    await expect(
      page.getByText("채팅방은 최대 100개까지 생성할 수 있습니다.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(input(page)).toHaveValue(message);
    await expect(input(page)).toBeEnabled();
  });
});

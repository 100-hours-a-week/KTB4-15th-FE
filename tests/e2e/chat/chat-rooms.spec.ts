import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures/test";
import { apiURL, makeRoom } from "../fixtures/chat-data";
import { configure } from "../fixtures/chat-actions";

async function openList(page: Page) {
  await page.getByRole("button", { name: "대화 목록 열기" }).click();
  await expect(
    page.getByRole("navigation", { name: "대화 목록", exact: true }),
  ).toBeVisible();
}

async function menu(
  page: Page,
  action: "이름 수정" | "삭제하기",
  title = "대화 1",
) {
  await page
    .getByRole("button", { name: `${title} 메뉴 열기`, exact: true })
    .click();
  await page.getByRole("menuitem", { name: action }).click();
}

test("대화가 없으면 빈 목록을 보여주며 닫기와 새 채팅이 동작한다", async ({
  page,
}) => {
  await page.goto("/chat");
  await openList(page);
  await expect(
    page.getByText("아직 대화가 없어요", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "채팅 목록 닫기" }).click();
  await expect(
    page.getByRole("button", { name: "대화 목록 열기" }),
  ).toBeFocused();
  await openList(page);
  await page.getByRole("button", { name: "새 채팅", exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(
    page.getByRole("navigation", { name: "대화 목록", exact: true }),
  ).toHaveCount(0);
});

test.describe("저장된 대화", () => {
  test.use({ scenario: { rooms: [makeRoom(1), makeRoom(2)] } });

  test("목록에서 방을 바꾸면 해당 대화만 보이고 새 채팅으로 돌아갈 수 있다", async ({
    page,
  }) => {
    await page.goto("/chat/1");
    await expect(page.getByText("답변 1", { exact: true })).toBeVisible();
    await openList(page);
    await expect(page.getByRole("link", { name: /^대화 1 / })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.getByRole("link", { name: /^대화 2 / }).click();
    await expect(page).toHaveURL(/\/chat\/2$/);
    await expect(page.getByText("답변 2", { exact: true })).toBeVisible();
    await expect(page.getByText("답변 1", { exact: true })).toHaveCount(0);
    await openList(page);
    await page.getByRole("button", { name: "새 채팅", exact: true }).click();
    await expect(page).toHaveURL(/\/chat$/);
    await expect(
      page.getByRole("textbox", { name: "메시지, 최대 500자" }),
    ).toHaveValue("");
    await expect(page.getByText("답변 2", { exact: true })).toHaveCount(0);
  });

  test("이름은 빈 값·변경 없음으로 저장할 수 없으며 20자 제한과 공백 제거를 적용한다", async ({
    page,
  }) => {
    await page.goto("/chat/1");
    await openList(page);
    await menu(page, "이름 수정");
    const dialog = page.getByRole("dialog", { name: "채팅 이름 변경" });
    const field = dialog.getByRole("textbox", {
      name: "채팅 이름",
      exact: true,
    });
    const save = dialog.getByRole("button", { name: "변경 완료" });
    await expect(save).toBeDisabled();
    await field.fill("   ");
    await expect(save).toBeDisabled();
    await field.fill("가".repeat(21));
    await expect(field).toHaveValue("가".repeat(20));
    await field.fill("  출근 코디  ");
    const patch = page.waitForRequest(
      (req) =>
        req.method() === "PATCH" && req.url() === `${apiURL}/chat-rooms/1`,
    );
    await save.click();
    expect((await patch).postDataJSON()).toEqual({ title: "출근 코디" });
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "출근 코디 메뉴 열기" }),
    ).toBeVisible();
    await page.reload();
    await openList(page);
    await expect(
      page.getByRole("button", { name: "출근 코디 메뉴 열기" }),
    ).toBeVisible();
  });

  test("삭제 확인에서 취소하면 유지하고 현재 방을 삭제하면 채팅 홈으로 이동한다", async ({
    page,
  }) => {
    await page.goto("/chat/1");
    await openList(page);
    await menu(page, "삭제하기");
    const dialog = page.getByRole("dialog", {
      name: "채팅을 삭제하시겠습니까?",
    });
    await dialog.getByRole("button", { name: "취소", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "대화 1 메뉴 열기" }),
    ).toBeVisible();
    await menu(page, "삭제하기");
    await dialog.getByRole("button", { name: "삭제하기", exact: true }).click();
    await expect(page).toHaveURL(/\/chat$/);
    await openList(page);
    await expect(
      page.getByRole("button", { name: "대화 1 메뉴 열기" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "대화 2 메뉴 열기" }),
    ).toBeVisible();
    await page.reload();
    await openList(page);
    await expect(
      page.getByRole("button", { name: "대화 1 메뉴 열기" }),
    ).toHaveCount(0);
  });

  test("다른 방을 삭제해도 현재 대화는 유지한다", async ({ page }) => {
    await page.goto("/chat/2");
    await openList(page);
    await menu(page, "삭제하기");
    await page
      .getByRole("dialog", { name: "채팅을 삭제하시겠습니까?" })
      .getByRole("button", { name: "삭제하기", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "대화 1 메뉴 열기" }),
    ).toHaveCount(0);
    await expect(page).toHaveURL(/\/chat\/2$/);
    await page.getByRole("button", { name: "채팅 목록 닫기" }).click();
    await expect(page.getByText("답변 2", { exact: true })).toBeVisible();
  });

  for (const action of ["이름 수정", "삭제하기"] as const) {
    test(`${action} 실패는 기존 방을 유지하고 재시도할 수 있다`, async ({
      page,
      request,
    }) => {
      const flag = action === "이름 수정" ? "failRename" : "failDeleteRoom";
      await configure(request, { [flag]: true });
      await page.goto("/chat/1");
      await openList(page);
      await menu(page, action);
      const dialog = page.getByRole("dialog", {
        name:
          action === "이름 수정"
            ? "채팅 이름 변경"
            : "채팅을 삭제하시겠습니까?",
      });
      if (action === "이름 수정")
        await dialog
          .getByRole("textbox", { name: "채팅 이름", exact: true })
          .fill("수정 제목");
      const confirm = dialog.getByRole("button", {
        name: action === "이름 수정" ? "변경 완료" : "삭제하기",
        exact: true,
      });
      await confirm.click();
      await expect(
        page.getByText(
          action === "이름 수정"
            ? "채팅방 이름을 수정하지 못했어요."
            : "채팅방을 삭제하지 못했어요.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(dialog).toBeVisible();
      await expect(page).toHaveURL(/\/chat\/1$/);
      await configure(request, { [flag]: false });
      await confirm.click();
      await expect(dialog).toHaveCount(0);
      if (action === "이름 수정")
        await expect(
          page.getByRole("button", { name: "수정 제목 메뉴 열기" }),
        ).toBeVisible();
      else await expect(page).toHaveURL(/\/chat$/);
    });
  }
});

test.describe("목록 오류", () => {
  test.use({ scenario: { rooms: [makeRoom(1)], failRoomList: true } });
  test("조회 실패를 안내하고 다시 불러올 수 있다", async ({
    page,
    request,
  }) => {
    await page.goto("/chat");
    await openList(page);
    await expect(
      page.getByText("대화 목록을 불러오지 못했어요", { exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await configure(request, { failRoomList: false });
    await page.getByRole("button", { name: "다시 시도", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "대화 1 메뉴 열기" }),
    ).toBeVisible();
  });
});

test.describe("대화 목록 추가 조회", () => {
  test.use({
    scenario: {
      rooms: Array.from({ length: 24 }, (_, i) => makeRoom(i + 1)),
      failRoomListPage: true,
    },
  });
  test("20개 이후 조회 실패 시 기존 목록을 유지하고 재시도로 나머지를 불러온다", async ({
    page,
    request,
  }) => {
    await page.goto("/chat");
    await openList(page);
    await page
      .getByRole("button", { name: "대화 5 메뉴 열기", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByText("추가 대화를 불러오지 못했어요", { exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: "대화 24 메뉴 열기", exact: true }),
    ).toHaveCount(1);
    await configure(request, { failRoomListPage: false });
    await page.getByRole("button", { name: "다시 시도", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "대화 1 메뉴 열기", exact: true }),
    ).toHaveCount(1);
    await expect(
      page
        .getByRole("navigation", { name: "대화 목록", exact: true })
        .getByRole("link"),
    ).toHaveCount(24);
  });
});

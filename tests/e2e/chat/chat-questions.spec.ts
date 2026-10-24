import { test, expect } from "../fixtures/test";
import { finishReply } from "../helpers/chat";
import { writes } from "../helpers/mock-api";

const questions = [
  ["주말 데이트 5만원대 셔츠", "주말 데이트에 입을 5만원대 셔츠를 추천해줘"],
  [
    "결혼식 하객룩 8만원대 자켓",
    "결혼식에 입을 8만원대 하객룩 자켓을 추천해줘",
  ],
  [
    "데일리 출근용 2만원대 기본 상의",
    "데일리 출근용으로 입을 2만원대 기본 상의를 추천해줘",
  ],
];

for (const [title, content] of questions) {
  test(`추천 질문: ${title}`, async ({ page, request }) => {
    await page.goto("/chat");
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await finishReply(page, request);
    expect((await writes(request, "/chat-rooms"))[0].body).toEqual({
      content,
      sourceType: "GENERAL",
    });
    await expect(page.getByText(content, { exact: true })).toBeVisible();
  });
}

for (const count of [9, 10]) {
  test.describe(`찜 ${count}개`, () => {
    test.use({ scenario: { wishlistCount: count } });
    test("10개 이상에서만 찜 기반 추천 질문을 표시한다", async ({
      page,
      request,
    }) => {
      await page.goto("/chat");
      const question = page.getByRole("button", {
        name: /찜 목록 기반 코디 추천/,
      });
      if (count < 10) {
        await expect(question).toHaveCount(0);
      } else {
        await question.click();
        await finishReply(page, request);
        expect((await writes(request, "/chat-rooms"))[0].body).toEqual({
          content: "내가 찜한 상품을 기반으로 코디를 추천해줘",
          sourceType: "WISHLIST",
        });
      }
    });
  });
}

test.describe("찜 개수 조회 실패", () => {
  test.use({ scenario: { failWishlistCount: true } });
  test("찜 기반 질문만 숨기고 일반 질문으로 대화를 시작할 수 있다", async ({
    page,
    request,
  }) => {
    await page.goto("/chat");
    await expect(
      page.getByRole("button", { name: /찜 목록 기반 코디 추천/ }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: new RegExp(questions[0][0]) })
      .click();
    await finishReply(page, request);
  });
});

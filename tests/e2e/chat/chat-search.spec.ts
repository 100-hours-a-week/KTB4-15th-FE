import { test, expect } from "../fixtures/test";

const items = [
  {
    chatRoomId: 25,
    title: "여름 코디",
    messageId: 382,
    message: "반바지 추천",
  },
  {
    chatRoomId: 18,
    title: "출근 코디",
    messageId: 327,
    message: "하얀 반바지",
  },
  {
    chatRoomId: 25,
    title: "여름 코디",
    messageId: 381,
    message: "린넨 반바지",
  },
];

test("검색 결과를 응답 순서대로 메시지별로 표시하고 검색어를 복원한다", async ({
  page,
}) => {
  await page.route("**/chat-rooms/search?keyword=*", (route) =>
    route.fulfill({
      json: {
        code: "CHAT_ROOM_SEARCH_SUCCESS",
        data: { items },
        message: "성공",
      },
    }),
  );
  await page.goto("/chat/search");
  const input = page.getByRole("searchbox", { name: "대화 내용 검색" });
  await input.fill("반바지");
  const results = page.getByRole("list", { name: "검색 결과" });
  await expect(results.getByRole("link")).toHaveCount(3);
  await expect(results.locator("strong")).toHaveText(
    items.map((item) => item.title),
  );
  await expect(results.locator("p")).toHaveText(
    items.map((item) => item.message),
  );
  await expect(results.locator("mark")).toHaveText([
    "반바지",
    "반바지",
    "반바지",
  ]);
  await expect(page).toHaveURL(/keyword=/);
  await page.reload();
  await expect(input).toHaveValue("반바지");
  await expect(results.getByRole("link")).toHaveCount(3);
  await page.getByRole("button", { name: "검색어 지우기" }).click();
  await expect(results).toHaveCount(0);
});

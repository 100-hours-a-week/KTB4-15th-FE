import { test, expect } from "./fixtures/test";

test("회원 탈퇴 안내와 메일 링크를 제공하고 닫으면 포커스를 복원한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/mypage");
  const trigger = page.getByRole("button", { name: "회원 탈퇴", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "회원 탈퇴 안내" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "메일로 문의하기" }),
  ).toHaveAttribute(
    "href",
    "mailto:master@lookddak.com?subject=%ED%9A%8C%EC%9B%90%20%ED%83%88%ED%87%B4%20%EB%AC%B8%EC%9D%98",
  );
  await dialog.getByRole("button", { name: "닫기" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "../fixtures/test";
import { apiURL, message, partialReply, selectedProduct } from "../data/chat";

export const input = (page: Page) =>
  page.getByRole("textbox", { name: "메시지, 최대 500자" });
export const productCard = (page: Page) =>
  page.getByRole("article", {
    name: `추천 상품 2: ${selectedProduct.productName}`,
  });
export async function finishReply(page: Page, request: APIRequestContext) {
  await expect(page.getByText(partialReply, { exact: true })).toBeVisible();
  await expect(input(page)).toBeDisabled();
  const response = await request.post(`${apiURL}/__test/finish-stream`);
  expect(response.ok()).toBeTruthy();
  await expect(productCard(page)).toBeVisible();
  await expect(input(page)).toBeEnabled();
}

export async function recommend(page: Page, request: APIRequestContext) {
  await page.goto("/chat");
  await input(page).fill(message);
  await page.getByRole("button", { name: "메시지 전송", exact: true }).click();
  await expect(page).toHaveURL(/\/chat\/1$/);
  await finishReply(page, request);
}

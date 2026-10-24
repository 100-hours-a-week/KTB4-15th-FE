import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { apiURL, type Scenario } from "../data/chat";

export async function configure(
  request: APIRequestContext,
  scenario: Partial<Scenario>,
) {
  expect(
    (await request.post(`${apiURL}/__test/scenario`, { data: scenario })).ok(),
  ).toBeTruthy();
}

export async function writes(request: APIRequestContext, path: string) {
  const { data } = await (
    await request.get(`${apiURL}/__test/requests`)
  ).json();
  return data.requests.filter(
    (item: { method: string; path: string }) =>
      item.method === "POST" && item.path === path,
  );
}

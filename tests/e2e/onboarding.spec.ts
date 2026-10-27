import { expect, test } from "@playwright/test";
import { ONBOARDING_COOKIE_NAME } from "../../src/features/onboarding/model/onboarding-cookie";

for (const value of [undefined, "false", "true"]) {
  test(`onboarding access with completion cookie ${value}`, async ({
    request,
  }) => {
    const response = await request.get("/onboarding", {
      headers: value ? { Cookie: `${ONBOARDING_COOKIE_NAME}=${value}` } : {},
      maxRedirects: 0,
    });

    if (value === "true") {
      expect(response.status()).toBe(307);
      expect(
        new URL(response.headers().location, response.url()).pathname,
      ).toBe("/login");
    } else {
      expect(response.status()).toBe(200);
      expect(await response.text()).toContain("AI 스타일 추천");
    }
  });
}

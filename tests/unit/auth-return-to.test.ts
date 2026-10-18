import assert from "node:assert/strict";
import test from "node:test";

import { getSafeReturnTo } from "../../src/app/bff/auth/_lib/return-to.ts";

test("auth refresh accepts only same-origin internal return paths", () => {
  assert.equal(
    getSafeReturnTo(
      "https://lookddak.com/bff/auth/refresh?returnTo=%2Fmypage%3Ftab%3Dprofile",
    ),
    "/mypage?tab=profile",
  );
  assert.equal(
    getSafeReturnTo(
      "https://lookddak.com/bff/auth/refresh?returnTo=https%3A%2F%2Fevil.example",
    ),
    "/",
  );
  assert.equal(
    getSafeReturnTo(
      "https://lookddak.com/bff/auth/refresh?returnTo=%2F%2Fevil.example",
    ),
    "/",
  );
});

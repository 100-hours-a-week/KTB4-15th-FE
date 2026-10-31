import assert from "node:assert/strict";
import test from "node:test";

import { getPriceChangeText } from "../../src/features/wishlist/lib/wishlist-display.ts";

test("getPriceChangeText formats unchanged, reduced, and increased prices", () => {
  assert.equal(getPriceChangeText(0, 10_000, 10_000), "가격 변동 없음");
  assert.equal(getPriceChangeText(-18, 10_000, 8_200), "18% ↓");
  assert.equal(getPriceChangeText(7, 10_000, 10_700), "7% ↑");
  assert.equal(getPriceChangeText(0, 31_340, 31_190), "1% 미만 ↓");
  assert.equal(getPriceChangeText(0, 31_190, 31_340), "1% 미만 ↑");
});

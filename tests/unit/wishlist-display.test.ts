import assert from "node:assert/strict";
import test from "node:test";

import { getPriceChangeText } from "../../src/features/wishlist/lib/wishlist-display.ts";

test("getPriceChangeText formats unchanged, reduced, and increased prices", () => {
  assert.equal(getPriceChangeText(0), "가격 변동 없음");
  assert.equal(getPriceChangeText(-18), "18% ↓");
  assert.equal(getPriceChangeText(7), "7% ↑");
});

import assert from "node:assert/strict";
import test from "node:test";

import { getKeyboardInset } from "../../src/shared/ui/navigation/navigation-keyboard.ts";

test("keyboard inset ignores browser chrome and measures an open keyboard", () => {
  assert.equal(getKeyboardInset(800, 740, 0), 0);
  assert.equal(getKeyboardInset(800, 500, 0), 300);
  assert.equal(getKeyboardInset(800, 500, 20), 280);
});

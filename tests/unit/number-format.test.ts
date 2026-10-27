import assert from "node:assert/strict";
import test from "node:test";

import { formatCompactNumber } from "../../src/shared/utils/number-format.ts";

test("compact counts use English units and truncate without crossing unit boundaries", () => {
  const cases: [number, string][] = [
    [0, "0"],
    [1, "1"],
    [99, "99"],
    [100, "100"],
    [999, "999"],
    [1000, "1K"],
    [1234, "1K"],
    [9999, "9K"],
    [10000, "10K"],
    [12345, "12K"],
    [999999, "999K"],
    [1000000, "1M"],
    [999999999, "999M"],
    [1000000000, "1B"],
    [99999999, "99M"],
    [100000000, "100M"],
    [123456789, "123M"],
  ];

  for (const [value, expected] of cases) {
    assert.equal(formatCompactNumber(value), expected, String(value));
  }
});

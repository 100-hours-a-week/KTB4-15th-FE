import assert from "node:assert/strict";
import test from "node:test";
import { getResponse } from "msw";

import { handlers } from "../../src/mocks/handlers.ts";

for (const type of ["WISH", "CLICK"]) {
  test(`ranking mock covers count boundaries for ${type}`, async () => {
    const response = await getResponse(
      handlers,
      new Request(`https://example.com/products/rankings?type=${type}`),
    );
    assert.equal(response?.status, 200);
    const { data } = await response!.json();
    assert.equal(data.type, type);
    assert.deepEqual(
      data.items.map((item: { rankingCount: number }) => item.rankingCount),
      [
        123456789, 100000000, 99999999, 12345, 10000, 9999, 1234, 1000, 999,
        100, 99, 1, 0,
      ],
    );
    assert.equal(
      new Set(data.items.map((item: { productId: number }) => item.productId))
        .size,
      data.items.length,
    );
    assert.deepEqual(
      data.items.map((item: { rank: number }) => item.rank),
      Array.from({ length: data.items.length }, (_, index) => index + 1),
    );
  });
}

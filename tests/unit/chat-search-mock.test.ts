import assert from "node:assert/strict";
import test from "node:test";
import { getResponse } from "msw";
import { handlers } from "../../src/mocks/handlers.ts";

test("chat search matches message content rather than room titles", async () => {
  for (const [keyword, expectedIds] of [
    ["검정", [382]],
    ["반바지", [381, 382, 383, 327]],
    ["출근", []],
  ] as const) {
    const response = await getResponse(
      handlers,
      new Request(
        `https://example.com/chat-rooms?${new URLSearchParams({ keyword })}`,
      ),
    );
    assert.equal(response?.status, 200);
    const { data } = await response!.json();
    assert.deepEqual(
      data.items.map((item: { messageId: number }) => item.messageId),
      expectedIds,
    );
  }
});

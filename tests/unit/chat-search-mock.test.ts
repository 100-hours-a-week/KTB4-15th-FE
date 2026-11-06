import assert from "node:assert/strict";
import test from "node:test";
import { getResponse } from "msw";
import { handlers } from "../../src/mocks/handlers.ts";

test("chat search matches message content rather than room titles", async () => {
  for (const [keyword, expectedIds] of [
    ["검정", [382]],
    [
      "반바지",
      [
        381,
        382,
        383,
        327,
        ...Array.from({ length: 16 }, (_, index) => 400 + index),
      ],
    ],
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

test("mock search results resolve to the anchor and independent history cursors", async () => {
  const endpoint = "https://example.com/chat-rooms/25/messages";
  const read = async (query: string) => {
    const response = await getResponse(
      handlers,
      new Request(`${endpoint}?${query}`),
    );
    assert.equal(response?.status, 200);
    return (await response!.json()).data;
  };

  const context = await read("aroundMessageId=381&beforeSize=20&afterSize=20");
  assert.equal(context.anchorMessageId, 381);
  assert.equal(context.messages[20].content, "반바지로 알아봐줘.");
  assert.equal(context.messages.length, 41);
  assert.ok(context.hasPrevious && context.hasNext);

  const older = await read(`before=${context.previousCursor}`);
  assert.equal(older.messages.at(-1).messageId, context.previousCursor - 1);
  assert.equal(older.nextCursor, null);

  const newer = await read(`after=${context.nextCursor}`);
  assert.equal(newer.messages[0].messageId, context.nextCursor + 1);
  assert.equal(newer.previousCursor, null);

  const latest = await read("size=20");
  assert.equal(latest.messages.length, 20);
  assert.equal(latest.hasNext, false);
});

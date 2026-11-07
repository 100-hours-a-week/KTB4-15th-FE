import assert from "node:assert/strict";
import test from "node:test";
import { getResponse } from "msw";
import { handlers } from "../../src/mocks/handlers.ts";

for (const endpoint of ["wishlists", "fitting-candidates"]) {
  test(`${endpoint}: pagination preview keeps initial items and fails only additional pages`, async () => {
    const initial = await getResponse(
      handlers,
      new Request(
        `https://example.com/${endpoint}?mockPagination=fail&size=10`,
      ),
    );
    assert.equal(initial?.status, 200);
    const { data } = await initial!.json();
    assert.equal(data.items.length, 10);
    assert.equal(data.totalCount, 100);
    assert.equal(data.hasNext, true);
    const failed = await getResponse(
      handlers,
      new Request(
        `https://example.com/${endpoint}?mockPagination=fail&cursor=${data.nextCursor}`,
      ),
    );
    assert.equal(failed?.status, 400);
    const recovered = await getResponse(
      handlers,
      new Request(`https://example.com/${endpoint}?cursor=${data.nextCursor}`),
    );
    assert.equal(recovered?.status, 200);
  });
}

for (const endpoint of ["chat-rooms", "chat-rooms/1/messages"]) {
  test(`${endpoint}: chat preview fails only cursor requests`, async () => {
    const initial = await getResponse(
      handlers,
      new Request(`https://example.com/${endpoint}?mockPagination=fail`),
    );
    assert.equal(initial?.status, 200);
    const { data } = await initial!.json();
    const cursor = data.previousCursor ?? data.nextCursor;
    const direction = data.previousCursor ? "before" : "cursor";
    assert.ok(cursor);
    const failed = await getResponse(
      handlers,
      new Request(
        `https://example.com/${endpoint}?mockPagination=fail&${direction}=${cursor}`,
      ),
    );
    assert.equal(failed?.status, 400);
  });
}

for (const endpoint of [
  "wishlists",
  "fitting-candidates",
  "fitting-results",
  "chat-rooms",
  "chat-rooms/1/messages",
]) {
  test(`${endpoint}: recovery preview fails once then succeeds`, async () => {
    const initial = await getResponse(
      handlers,
      new Request(`https://example.com/${endpoint}?mockPagination=recover`),
    );
    assert.equal(initial?.status, 200);
    const { data } = await initial!.json();
    const cursor = data.previousCursor ?? data.nextCursor;
    const direction = data.previousCursor ? "before" : "cursor";
    assert.ok(cursor);
    const url = `https://example.com/${endpoint}?mockPagination=recover&${direction}=${cursor}`;
    assert.equal((await getResponse(handlers, new Request(url)))?.status, 400);
    assert.equal((await getResponse(handlers, new Request(url)))?.status, 200);
  });
}

test("wardrobe preview respects TOP, BOTTOM and ALL filters", async () => {
  for (const itemType of ["TOP", "BOTTOM", "ALL"]) {
    const response = await getResponse(
      handlers,
      new Request(
        `https://example.com/fitting-candidates?${itemType === "ALL" ? "" : `itemType=${itemType}`}`,
      ),
    );
    const { data } = await response!.json();
    assert.equal(data.totalCount, itemType === "ALL" ? 100 : 50);
    assert.deepEqual(
      [
        ...new Set(
          data.items.map((item: { itemType: string }) => item.itemType),
        ),
      ].sort(),
      itemType === "ALL" ? ["BOTTOM", "TOP"] : [itemType],
    );
  }
});

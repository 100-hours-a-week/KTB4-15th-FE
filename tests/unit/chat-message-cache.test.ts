import assert from "node:assert/strict";
import test from "node:test";
import { updateChatGenerationCache } from "../../src/features/chat/model/chat-message-cache.ts";
import type {
  ChatMessageContextResponse,
  ChatGenerationStatusResponse,
} from "../../src/features/chat/schema/chat.ts";

test("generation recovery updates only its messages and preserves pagination", () => {
  const user = {
    messageId: 10,
    senderType: "USER" as const,
    content: "요청",
    generationStatus: "GENERATING" as const,
    recommendation: null,
    createdAt: "2026-11-07",
  };
  const page: ChatMessageContextResponse = {
    chatRoomId: 1,
    title: "대화",
    anchorMessageId: null,
    messages: [user],
    previousCursor: 10,
    nextCursor: null,
    hasPrevious: true,
    hasNext: false,
  };
  const status: ChatGenerationStatusResponse = {
    generationStatus: "COMPLETED",
    message: {
      messageId: 11,
      senderType: "AI",
      content: "답변",
      generationStatus: null,
      recommendation: null,
      createdAt: "2026-11-07",
    },
  };
  const data = { pages: [page], pageParams: [null] };
  const updated = updateChatGenerationCache(data, 10, status)!;
  assert.equal(updated.pages[0].messages[0].generationStatus, "COMPLETED");
  assert.deepEqual(
    updated.pages[0].messages.map((message) => message.messageId),
    [10, 11],
  );
  assert.equal(updated.pages[0].previousCursor, 10);
  assert.equal(updated.pageParams, data.pageParams);
  assert.equal(page.messages.length, 1);
  assert.equal(updateChatGenerationCache(data, 999, status), data);
  assert.deepEqual(updateChatGenerationCache(updated, 10, status), updated);
  assert.equal(updateChatGenerationCache(undefined, 10, status), undefined);
});

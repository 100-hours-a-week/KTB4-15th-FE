import type { ChatMessageResponse } from "../features/chat/schema/chat.ts";

export function chatHistoryPage(
  room: { chatRoomId: number; title: string; messages: ChatMessageResponse[] },
  params: URLSearchParams,
) {
  const anchorMessageId = Number(params.get("aroundMessageId")) || null;
  const before = Number(params.get("before"));
  const after = Number(params.get("after"));
  const size = Number(params.get("size") ?? 20);
  const anchorIndex = room.messages.findIndex(
    (message) => message.messageId === anchorMessageId,
  );
  if (anchorMessageId != null && anchorIndex === -1) return null;

  const eligible = room.messages.filter(
    ({ messageId }) =>
      (!before || messageId < before) && (!after || messageId > after),
  );
  const start = anchorIndex - Number(params.get("beforeSize") ?? 20);
  const end = anchorIndex + Number(params.get("afterSize") ?? 20) + 1;
  const messages =
    anchorMessageId != null
      ? eligible.slice(Math.max(0, start), end)
      : after
        ? eligible.slice(0, size)
        : eligible.slice(-size);
  const hasPrevious =
    anchorMessageId != null ? start > 0 : !after && eligible.length > size;
  const hasNext =
    anchorMessageId != null
      ? end < eligible.length
      : !!after && eligible.length > size;

  return {
    ...room,
    anchorMessageId,
    messages,
    previousCursor: hasPrevious ? messages[0].messageId : null,
    nextCursor: hasNext ? messages.at(-1)!.messageId : null,
    hasPrevious,
    hasNext,
  };
}

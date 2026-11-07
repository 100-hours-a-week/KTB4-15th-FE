import type { InfiniteData } from "@tanstack/react-query";
import type {
  ChatGenerationStatusResponse,
  ChatMessageContextResponse,
} from "../schema/chat.ts";

export function updateChatGenerationCache(
  data: InfiniteData<ChatMessageContextResponse> | undefined,
  userMessageId: number,
  status: ChatGenerationStatusResponse,
) {
  if (!data) return data;
  const reply = status.message;
  const hasReply =
    reply != null &&
    data.pages.some((page) =>
      page.messages.some((message) => message.messageId === reply.messageId),
    );

  const hasUser = data.pages.some((page) =>
    page.messages.some((message) => message.messageId === userMessageId),
  );
  if (!hasUser && !hasReply) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.flatMap((message) => {
        if (
          message.messageId === userMessageId &&
          message.senderType === "USER"
        ) {
          const user = {
            ...message,
            generationStatus: status.generationStatus,
          };
          return reply && !hasReply ? [user, reply] : [user];
        }
        return [reply?.messageId === message.messageId ? reply : message];
      }),
    })),
  };
}

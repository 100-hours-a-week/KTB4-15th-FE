import "server-only";

import { parseResponse } from "@/shared/api/response";
import { serverApi } from "@/shared/api/server";
import { chatMessageContextResponse } from "../schema/chat";

export async function getInitialChatRoom(chatRoomId: number) {
  const response = await serverApi(
    `chat-rooms/${chatRoomId}/messages?size=20`,
    {
      cache: "no-store",
    },
  );
  return parseResponse(response, chatMessageContextResponse);
}

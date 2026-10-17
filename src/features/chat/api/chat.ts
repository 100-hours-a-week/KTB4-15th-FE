import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import { extractSseEvents } from "@/shared/api/sse";
import {
  chatRoomListResponse,
  chatStreamEvent,
  createChatRoomResponse,
  renameChatRoomRequest,
  renameChatRoomResponse,
  sendChatMessageResponse,
  chatRoomDetailResponse,
  type CreateChatRoomRequest,
  type RenameChatRoomRequest,
  type SendChatMessageRequest,
} from "../schema/chat";

export async function createChatRoom(payload: CreateChatRoomRequest) {
  const response = await apiClient.post("chat-rooms", {
    json: payload,
  });

  return parseResponse(response, createChatRoomResponse);
}

export async function sendChatMessage(
  chatRoomId: number,
  payload: SendChatMessageRequest,
) {
  const response = await apiClient.post(`chat-rooms/${chatRoomId}/messages`, {
    json: payload,
  });

  return parseResponse(response, sendChatMessageResponse);
}

export async function* connectChatStream(
  chatRoomId: number,
  messageId: number,
  signal: AbortSignal,
) {
  // EventSource 대신 기존 인증 갱신과 연결 취소 흐름을 재사용한다.
  const response = await apiClient.get(
    `chat-rooms/${chatRoomId}/messages/${messageId}/stream`,
    {
      headers: { Accept: "text/event-stream" },
      retry: 0,
      signal,
      timeout: false,
    },
  );
  const reader = response.body?.getReader();

  if (reader == null) {
    throw new Error("스트리밍 응답을 읽을 수 없습니다.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const parsed = extractSseEvents(buffer);
      buffer = parsed.rest;

      for (const event of parsed.events) {
        if (
          event.event !== "connected" &&
          event.event !== "snapshot" &&
          event.event !== "token" &&
          event.event !== "done" &&
          event.event !== "error"
        ) {
          continue;
        }

        yield chatStreamEvent.parse({
          type: event.event,
          ...JSON.parse(event.data),
        });
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

export async function getChatRoom(
  chatRoomId: number,
  cursor: number | null = null,
) {
  const searchParams = new URLSearchParams();
  if (cursor !== null) {
    searchParams.set("cursor", cursor.toString());
  }
  searchParams.set("size", "20");
  const response = await apiClient.get(
    `chat-rooms/${chatRoomId}?${searchParams.toString()}`,
  );
  return parseResponse(response, chatRoomDetailResponse);
}

export async function getChatRooms(cursor: number | null = null) {
  const searchParams = new URLSearchParams();
  if (cursor !== null) {
    searchParams.set("cursor", cursor.toString());
  }
  searchParams.set("size", "20");
  const response = await apiClient.get(`chat-rooms?${searchParams.toString()}`);
  return parseResponse(response, chatRoomListResponse);
}

export async function renameChatRoom(
  chatRoomId: number,
  payload: RenameChatRoomRequest,
) {
  const body = renameChatRoomRequest.parse(payload);
  const response = await apiClient.patch(`chat-rooms/${chatRoomId}`, {
    json: body,
  });

  return parseResponse(response, renameChatRoomResponse);
}

export async function deleteChatRoom(chatRoomId: number) {
  await apiClient.delete(`chat-rooms/${chatRoomId}`);
}

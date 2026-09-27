import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
  chatGenerationResponse,
  chatRoomListResponse,
  createChatRoomResponse,
  renameChatRoomRequest,
  renameChatRoomResponse,
  sendChatMessageResponse,
  chatRoomDetailResponse,
  type CreateChatRoomRequest,
  type RenameChatRoomRequest,
  type SendChatMessageRequest,
} from "../schema/chat";

const CHAT_REQUEST_TIMEOUT_MS = 10_000;
export const CHAT_ROOM_LIMIT = 100;

export async function createChatRoom(payload: CreateChatRoomRequest) {
  const response = await apiClient.post("chat-rooms", {
    json: payload,
    timeout: CHAT_REQUEST_TIMEOUT_MS,
  });

  return parseResponse(response, createChatRoomResponse);
}

export async function sendChatMessage(
  chatRoomId: number,
  payload: SendChatMessageRequest,
) {
  const response = await apiClient.post(`chat-rooms/${chatRoomId}/messages`, {
    json: payload,
    timeout: CHAT_REQUEST_TIMEOUT_MS,
  });

  return parseResponse(response, sendChatMessageResponse);
}

export async function getChatGenerationStatus(
  chatRoomId: number,
  messageId: number,
) {
  const response = await apiClient.get(
    `chat-rooms/${chatRoomId}/messages/${messageId}/status`,
    { timeout: CHAT_REQUEST_TIMEOUT_MS },
  );

  return parseResponse(response, chatGenerationResponse);
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

export async function getChatRooms(
  cursor: number | null = null,
  size: number = 20,
) {
  const searchParams = new URLSearchParams();
  if (cursor !== null) {
    searchParams.set("cursor", cursor.toString());
  }
  searchParams.set("size", size.toString());
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

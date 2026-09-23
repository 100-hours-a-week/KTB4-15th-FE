import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
  chatRoomListResponse,
  createChatRoomResponse,
  sendChatMessageResponse,
  type CreateChatRoomRequest,
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

export async function getChatRooms(cursor: number | null = null) {
  const searchParams = new URLSearchParams();
  if (cursor !== null) {
    searchParams.set("cursor", cursor.toString());
  }
  searchParams.set("size", "20");
  const response = await apiClient.get(`chat-rooms?${searchParams.toString()}`);
  return parseResponse(response, chatRoomListResponse);
}

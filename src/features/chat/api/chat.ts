import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
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

export type {
  AIMessageResponse,
  ChatGenerationErrorCode,
  ChatGenerationErrorResponse,
  ChatGenerationResponse,
  ChatGenerationStatus,
  ChatMessageResponse,
  ChatSourceType,
  CreateChatRoomRequest,
  CreateChatRoomResponse,
  RecommendationResponse,
  RecommendedProductResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
  UserMessageResponse,
} from "../schema/chat";

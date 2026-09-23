import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import {
  createChatRoomResponse,
  type CreateChatRoomRequest,
} from "../schema/chat";

export async function createChatRoom(payload: CreateChatRoomRequest) {
  const response = await apiClient.post("chat-rooms", {
    json: payload,
  });

  return parseResponse(response, createChatRoomResponse);
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
  UserMessageResponse,
} from "../schema/chat";

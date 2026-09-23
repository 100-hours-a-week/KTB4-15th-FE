import { z } from "zod";

export type ChatGenerationStatus = "GENERATING" | "COMPLETED" | "FAILED";
export type ChatSourceType = "GENERAL" | "WISHLIST";

export type CreateChatRoomRequest = {
  content: string;
  sourceType: ChatSourceType;
};

export const createChatRoomResponse = z.object({
  chatRoomId: z.number().int().positive(),
  messageId: z.number().int().positive(),
});

export type CreateChatRoomResponse = z.infer<typeof createChatRoomResponse>;

export type SendChatMessageRequest = {
  content: string;
};

export type RecommendedProductResponse = {
  productId: number;
  productName: string;
  productImageUrl: string;
  currentPrice: number;
  color: string;
  itemType: string;
  purchaseUrl: string;
  reason: string;
  isWishlisted: boolean;
  isFittingCandidate: boolean;
};

export type RecommendationResponse = {
  recommendationId: number;
  products: RecommendedProductResponse[];
};

export type AIMessageResponse = {
  messageId: number;
  senderType: "AI";
  content: string;
  recommendation: RecommendationResponse | null;
  createdAt: string;
};

export type UserMessageResponse = {
  messageId: number;
  senderType: "USER";
  content: string;
  createdAt: string;
};

export type ChatMessageResponse = UserMessageResponse | AIMessageResponse;

type PendingGenerationData = {
  status: "GENERATING" | "FAILED";
  message: null;
};

type CompletedGenerationData = {
  status: "COMPLETED";
  message: AIMessageResponse;
};

export type ChatGenerationResponse = {
  code: "CHAT_GENERATION_GET_SUCCESS";
  data: PendingGenerationData | CompletedGenerationData;
  message: string;
};

export type ChatGenerationErrorCode =
  | "UNAUTHORIZED"
  | "CHAT_ROOM_ACCESS_DENIED"
  | "CHAT_ROOM_NOT_FOUND"
  | "CHAT_GENERATION_GET_FAILED";

export type ChatGenerationErrorResponse = {
  code: ChatGenerationErrorCode;
  data: null;
  message: string;
};

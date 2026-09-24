import { z } from "zod";

export const CHAT_ROOM_TITLE_MAX_LENGTH = 20;

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

export const sendChatMessageResponse = z.object({
  chatRoomId: z.number().int().positive(),
  messageId: z.number().int().positive(),
  content: z.string(),
});

export type SendChatMessageResponse = z.infer<typeof sendChatMessageResponse>;

export const recommendedProductResponse = z.object({
  productId: z.number().int().positive(),
  productName: z.string(),
  productImageUrl: z.string(),
  currentPrice: z.number().int().nonnegative(),
  color: z.string(),
  itemType: z.string(),
  purchaseUrl: z.string(),
  reason: z.string().optional(),
  isWishlisted: z.boolean(),
  isFittingCandidate: z.boolean(),
});

export type RecommendedProductResponse = z.infer<
  typeof recommendedProductResponse
>;

export const recommendationResponse = z.object({
  recommendationId: z.number().int().positive(),
  products: z.array(recommendedProductResponse),
});

export type RecommendationResponse = z.infer<typeof recommendationResponse>;

export const aiMessageResponse = z.object({
  messageId: z.number().int().positive(),
  senderType: z.literal("AI"),
  content: z.string(),
  generationStatus: z.null(),
  recommendation: recommendationResponse.nullable(),
  createdAt: z.string(),
});

export type AIMessageResponse = z.infer<typeof aiMessageResponse>;

export type UserMessageResponse = {
  messageId: number;
  senderType: "USER";
  content: string;
  createdAt: string;
};

export type ChatMessageResponse = UserMessageResponse | AIMessageResponse;

export const chatGenerationResponse = z.discriminatedUnion("generationStatus", [
  z.object({
    generationStatus: z.enum(["GENERATING", "FAILED"]),
    message: z.null(),
  }),
  z.object({
    generationStatus: z.literal("COMPLETED"),
    message: aiMessageResponse,
  }),
]);

export type ChatGenerationResponse = z.infer<typeof chatGenerationResponse>;

export type ChatGenerationErrorCode =
  | "INVALID_INPUT_VALUE"
  | "UNAUTHORIZED"
  | "CHAT_ROOM_ACCESS_DENIED"
  | "CHAT_ROOM_NOT_FOUND"
  | "CHAT_MESSAGE_NOT_FOUND"
  | "INTERNAL_SERVER_ERROR";

export type ChatGenerationErrorResponse = {
  code: ChatGenerationErrorCode;
  data: null;
  message: string;
};

export const chatRoomItem = z.object({
  chatRoomId: z.number().int().positive(),
  title: z.string(),
  lastMessageAt: z.string(),
});

export const chatRoomListResponse = z.object({
  items: z.array(chatRoomItem),
  nextCursor: z.number().int().nullable(),
  hasNext: z.boolean(),
});

export type ChatRoomItem = z.infer<typeof chatRoomItem>;
export type ChatRoomListResponse = z.infer<typeof chatRoomListResponse>;

export const renameChatRoomRequest = z.object({
  title: z.string().trim().min(1).max(CHAT_ROOM_TITLE_MAX_LENGTH),
});

export type RenameChatRoomRequest = z.infer<typeof renameChatRoomRequest>;

export const renameChatRoomResponse = z.object({
  chatRoomId: z.number().int().positive(),
  title: z.string(),
});

export type RenameChatRoomResponse = z.infer<typeof renameChatRoomResponse>;

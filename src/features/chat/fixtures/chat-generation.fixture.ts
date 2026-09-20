import type { ChatGenerationResponse } from "../api/chat-api.types";

export const CHAT_GENERATION_GENERATING_FIXTURE = {
  code: "CHAT_GENERATION_GET_SUCCESS",
  data: {
    status: "GENERATING",
    message: null,
  },
  message: "AI 응답을 생성하고 있어요.",
} satisfies ChatGenerationResponse;

export const CHAT_GENERATION_COMPLETED_FIXTURE = {
  code: "CHAT_GENERATION_GET_SUCCESS",
  data: {
    status: "COMPLETED",
    message: {
      messageId: 502,
      senderType: "AI",
      content:
        "민우님을 위한 맞춤 아이템 3가지를 찾았어요.\n마음에 드는 옷은 피팅룸에서 가볍게 입어보세요.",
      recommendation: {
        recommendationId: 15,
        products: [
          {
            productId: 201,
            productName: "에센셜 크루넥 니트",
            productImageUrl: "https://image.example.com/product201.jpg",
            currentPrice: 49000,
            color: "BLACK",
            itemType: "TOP",
            purchaseUrl: "https://shop.example.com/products/201",
            reason: "요청한 가격대와 색상 조건에 적합한 상품입니다.",
            isWishlisted: false,
            isFittingCandidate: false,
          },
        ],
      },
      createdAt: "2026-09-21T10:24:00+09:00",
    },
  },
  message: "AI 응답 생성이 완료되었어요.",
} satisfies ChatGenerationResponse;

export const CHAT_GENERATION_FAILED_FIXTURE = {
  code: "CHAT_GENERATION_GET_SUCCESS",
  data: {
    status: "FAILED",
    message: null,
  },
  message: "AI 응답을 생성하지 못했어요.",
} satisfies ChatGenerationResponse;

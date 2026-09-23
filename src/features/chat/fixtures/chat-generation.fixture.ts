import type { ChatGenerationResponse } from "../api/chat-api.types";
import knitImage from "../icon/knit.png";
import shirtImage from "../icon/shirt.png";
import suitImage from "../icon/suit.png";

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
            productImageUrl: knitImage.src,
            currentPrice: 49000,
            color: "BLACK",
            itemType: "TOP",
            purchaseUrl: "https://shop.example.com/products/201",
            reason: "요청한 가격대와 색상 조건에 적합한 상품입니다.",
            isWishlisted: false,
            isFittingCandidate: false,
          },
          {
            productId: 202,
            productName: "테일러드 울 오버셔츠 자켓",
            productImageUrl: shirtImage.src,
            currentPrice: 89000,
            color: "차콜그레이",
            itemType: "OUTER",
            purchaseUrl: "https://shop.example.com/products/202",
            reason: "출근과 주말에 모두 활용하기 좋은 단정한 실루엣입니다.",
            isWishlisted: false,
            isFittingCandidate: false,
          },
          {
            productId: 203,
            productName: "미니멀 싱글 셋업 자켓",
            productImageUrl: suitImage.src,
            currentPrice: 79000,
            color: "네이비",
            itemType: "OUTER",
            purchaseUrl: "https://shop.example.com/products/203",
            reason: "격식 있는 자리와 데일리 룩에 함께 활용할 수 있습니다.",
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

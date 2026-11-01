import type { FittingCandidate } from "../../../src/features/fitting/schema/fitting-candidate";
import type {
  ChatMessageResponse,
  RecommendedProductResponse,
} from "../../../src/features/chat/schema/chat";

export const apiURL = "http://127.0.0.1:3101";
export const message = "검정색 슬랙스 추천해줘";
export const partialReply = "추천 상품을 찾았어요.";
export const reply = `${partialReply} 출근할 때 입기 좋은 상품이에요.`;
export const createdAt = "2026-10-24T09:00:00+09:00";
export const products: RecommendedProductResponse[] = [
  {
    productId: 101,
    productName: "베이직 셔츠",
    productImageUrl: "/images/fixtures/virtual-fitting.png",
    currentPrice: 39000,
    color: "화이트",
    itemType: "TOP",
    purchaseUrl: "https://shop.example.com/products/101",
    recommendedReason: "슬랙스와 함께 입기 좋아요.",
    isWishlisted: false,
    wishlistId: null,
    isFittingCandidate: false,
    fittingCandidateId: null,
  },
  {
    productId: 205,
    productName: "블랙 테이퍼드 슬랙스",
    productImageUrl: "/images/fixtures/virtual-fitting.png",
    currentPrice: 49000,
    color: "블랙",
    itemType: "BOTTOM",
    purchaseUrl: "https://shop.example.com/products/205",
    recommendedReason: "요청한 검정색 출근용 슬랙스예요.",
    isWishlisted: false,
    wishlistId: null,
    isFittingCandidate: false,
    fittingCandidateId: null,
  },
];
export const selectedProduct = products[1];

export type MockChatRoom = {
  chatRoomId: number;
  title: string;
  messages: ChatMessageResponse[];
};

export function makeRoom(chatRoomId: number): MockChatRoom {
  return {
    chatRoomId,
    title: `대화 ${chatRoomId}`,
    messages: [
      {
        messageId: 1,
        senderType: "USER",
        content: `질문 ${chatRoomId}`,
        createdAt,
        generationStatus: "COMPLETED",
        recommendation: null,
      },
      {
        messageId: 2,
        senderType: "AI",
        content: `답변 ${chatRoomId}`,
        createdAt,
        generationStatus: null,
        recommendation: null,
      },
    ],
  };
}

export type Scenario = {
  fullBodyImageUrl?: string;
  fittingCandidates?: FittingCandidate[];
  wishlistProducts?: RecommendedProductResponse[];
  memberStatus?:
    | "unauthenticated"
    | "incomplete"
    | "complete"
    | "refreshable"
    | "unavailable";
  hasUnreadNotifications?: boolean;
  notificationUnreadDelayMs?: number;
  failNotificationUnread?: boolean;
  rooms?: MockChatRoom[];
  wishlistCount?: number;
  failWishlistCount?: boolean;
  failRoomList?: boolean;
  failRoomListPage?: boolean;
  failRoomDetail?: boolean;
  failHistory?: boolean;
  failRename?: boolean;
  failDeleteRoom?: boolean;
  deniedRoom?: boolean;
  noProducts?: boolean;
  snapshot?: boolean;
  generatingFitting?: boolean;
  failCurrentFitting?: boolean;
  wishlistLimit?: boolean;
  roomLimit?: boolean;
  expiredRefresh?: boolean;
  failCreate?: boolean;
  failMessage?: boolean;
  failWishlist?: boolean;
  failDeleteWishlist?: boolean;
  failFitting?: boolean;
  streamFailure?: "error" | "disconnect" | "mismatch" | "malformed";
};

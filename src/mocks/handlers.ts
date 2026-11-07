import {
  delay,
  http,
  HttpResponse,
  passthrough,
  type RequestHandler,
} from "msw";

import type { ChatMessageResponse } from "../features/chat/schema/chat.ts";
import { chatHistoryPage } from "./chat-history.ts";

type MockProfile = {
  age: number | null;
  email: string;
  fullBodyImageUrl: string | null;
  height: number | null;
  name: string;
  priceAlertEnabled: boolean;
  weight: number | null;
};

type MockProfileUpdate = Partial<
  Omit<MockProfile, "email" | "fullBodyImageUrl">
> & {
  fullBodyImageValidationId?: number;
};

let profileCompleted = true;
let validatedFullBodyImageUrl: string | null = null;
let fittingResultSaved = false;
let fittingResultViewed = false;
let fittingResultOutfitName = "가을 출근 니트 룩";
const fittingJobCreatedAt = new Date().toISOString();
let profile: MockProfile = {
  age: null,
  email: "mock@lookddak.com",
  fullBodyImageUrl: null,
  height: null,
  name: "테스트 사용자",
  priceAlertEnabled: true,
  weight: null,
};

function success<T>(data: T) {
  return HttpResponse.json({ code: "SUCCESS", data, message: "성공" });
}

const rankingCounts = [
  123456789, 100000000, 99999999, 12345, 10000, 9999, 1234, 1000, 999, 100, 99,
  1, 0,
];

const rankingItems = {
  WISH: [
    {
      rank: 1,
      productId: 101,
      productName: "에센셜 램스울 크루넥",
      productImageUrl: "",
      itemType: "TOP",
      currentPrice: 59000,
      color: "네이비",
      rankingCount: 1300,
      purchaseUrl: "https://shop.example.com/products/101",
    },
    {
      rank: 2,
      productId: 205,
      productName: "모던 테이퍼드 슬랙스",
      productImageUrl:
        "https://img.29cm.co.kr/item/202603/11f116cc8996d99aa5409703b564503b.jpeg",
      itemType: "BOTTOM",
      currentPrice: 49000,
      color: "차콜",
      rankingCount: 956,
      purchaseUrl: "https://shop.example.com/products/205",
    },
  ],
  CLICK: [
    {
      rank: 1,
      productId: 205,
      productName: "모던 테이퍼드 슬랙스",
      productImageUrl:
        "https://img.29cm.co.kr/item/202603/11f116cc8996d99aa5409703b564503b.jpeg",
      itemType: "BOTTOM",
      currentPrice: 49000,
      color: "차콜",
      rankingCount: 14300,
      purchaseUrl: "https://shop.example.com/products/205",
    },
    {
      rank: 2,
      productId: 101,
      productName: "에센셜 램스울 크루넥",
      productImageUrl:
        "https://img.29cm.co.kr/item/202603/11f116cc8996d99aa5409703b564503b.jpeg",
      itemType: "TOP",
      currentPrice: 59000,
      color: "네이비",
      rankingCount: 11800,
      purchaseUrl: "https://shop.example.com/products/101",
    },
  ],
} as const;

function paginationMode(request: Request) {
  return new URLSearchParams(
    typeof window !== "undefined"
      ? window.location.search
      : new URL(request.url).search,
  ).get("mockPagination");
}

const failedPaginationRequests = new Set<string>();

async function paginationFailure(request: Request) {
  const url = new URL(request.url);
  const cursor =
    url.searchParams.get("cursor") ??
    url.searchParams.get("before") ??
    url.searchParams.get("after");
  if (cursor == null) return;
  const mode = paginationMode(request);
  if (mode === "slow" || mode === "recover" || mode === "fail")
    await delay(1000);
  const key = `${url.pathname}:${cursor}`;
  if (
    mode === "fail" ||
    (mode === "recover" && !failedPaginationRequests.has(key))
  ) {
    if (mode === "recover") failedPaginationRequests.add(key);
    return HttpResponse.json(
      { code: "MOCK_PAGINATION_ERROR", data: null, message: "추가 조회 실패" },
      { status: 400 },
    );
  }
}

const chatSearchItems = [
  {
    chatRoomId: 25,
    title: "검정 바지에 어울리는 상의",
    messageId: 381,
    message: "반바지로 알아봐줘.",
  },
  {
    chatRoomId: 25,
    title: "검정 바지에 어울리는 상의",
    messageId: 382,
    message: "검정 반바지에 입을 깔끔한 반팔 셔츠 추천해줘.",
  },
  {
    chatRoomId: 25,
    title: "검정 바지에 어울리는 상의",
    messageId: 383,
    message: "시원한 린넨 반바지와 매치하고 싶어요.",
  },
  {
    chatRoomId: 18,
    title: "출근용 셔츠 추천",
    messageId: 327,
    message: "하얀 반바지랑 어울리면 좋겠어요.",
  },
  {
    chatRoomId: 12,
    title: "가을 니트 코디",
    messageId: 204,
    message: "브라운 니트와 데님 조합을 추천해 주세요.",
  },
  ...[
    "반바지에 운동화를 신으면 양말은 어떤 길이가 좋아?",
    "베이지 반바지에 어울리는 티셔츠 색을 골라줘.",
    "여행 갈 때 입을 편한 반바지 코디 추천해줘.",
    "데님 반바지와 스트라이프 셔츠를 같이 입고 싶어요.",
    "반바지가 무릎 위까지 오는데 너무 짧아 보이지 않게 입으려면?",
    "네이비 반바지에 흰색 스니커즈를 신을 거예요.",
    "주말 산책용으로 반바지와 가벼운 바람막이를 맞춰줘.",
    "카키 반바지에는 어떤 색 상의가 자연스러워?",
    "반바지에 샌들을 신어도 단정해 보이는 조합이 있을까?",
    "오버핏 셔츠를 반바지 안에 넣어 입을지 고민돼요.",
    "여름 휴가에 입을 반바지 두 벌만 고르고 싶어요.",
    "회색 반바지에 파란 셔츠를 입으면 어때?",
    "반바지와 얇은 가디건을 함께 입는 코디를 보여줘.",
    "밝은 반바지를 입을 때 가방은 어떤 색이 좋을까?",
    "반바지에 로퍼를 신는 스타일도 추천해줘.",
    "비 오는 날에도 편하게 입을 수 있는 반바지 코디가 필요해요.",
    "흰 반바지에 어울리는 가방을 추천해줘.",
  ].map((message, index) => ({
    chatRoomId: index % 2 === 0 ? 25 : 18,
    title: index % 2 === 0 ? "여름 반바지 코디" : "편한 주말 스타일링",
    messageId: 400 + index,
    message,
  })),
] as const;

const mockChatRooms = new Map(
  [25, 18, 12].map((chatRoomId) => {
    const results = chatSearchItems.filter(
      (item) => item.chatRoomId === chatRoomId,
    );
    const matches = new Map<number, string>(
      results.map((item) => [item.messageId, item.message]),
    );
    const firstId = Math.min(...matches.keys()) - 25;
    const lastId = Math.max(...matches.keys()) + 25;
    const messages = Array.from(
      { length: lastId - firstId + 1 },
      (_, index): ChatMessageResponse => {
        const messageId = firstId + index;
        const match = matches.get(messageId);
        const createdAt = new Date(
          Date.UTC(2026, 10, 3, 0, index),
        ).toISOString();
        return match
          ? {
              messageId,
              createdAt,
              content: match,
              senderType: "USER",
              generationStatus: "COMPLETED",
              recommendation: null,
            }
          : {
              messageId,
              createdAt,
              content: `스타일링 대화 ${messageId}`,
              senderType: "AI",
              generationStatus: null,
              recommendation: null,
            };
      },
    );
    return [
      chatRoomId,
      { chatRoomId, title: results[0].title, messages },
    ] as const;
  }),
);

export const handlers: RequestHandler[] = [
  http.get("*/chat-rooms/:roomId/messages", async ({ request, params }) => {
    const failure = await paginationFailure(request);
    if (failure) return failure;
    const chatRoomId = Number(params.roomId);
    const room = mockChatRooms.get(chatRoomId) ?? {
      chatRoomId,
      title: `테스트 대화 ${chatRoomId}`,
      messages: Array.from({ length: 24 }, (_, index): ChatMessageResponse => ({
        messageId: index + 1,
        content: `이전 대화 ${index + 1} — 추가 조회 실패 UI를 확인하는 테스트 메시지입니다.`,
        createdAt: "2026-11-04T00:00:00",
        senderType: "AI",
        generationStatus: null,
        recommendation: null,
      })),
    };
    const page = chatHistoryPage(room, new URL(request.url).searchParams);
    if (page) return success(page);
    return HttpResponse.json(
      {
        code: "CHAT_MESSAGE_NOT_FOUND",
        data: null,
        message: "메시지를 찾을 수 없습니다.",
      },
      { status: 404 },
    );
  }),
  http.post("*/chat-rooms/:roomId/messages", async ({ request, params }) => {
    const room = mockChatRooms.get(Number(params.roomId));
    if (!room) return passthrough();
    const { content } = (await request.json()) as { content: string };
    const messageId = room.messages.at(-1)!.messageId + 1;
    const createdAt = new Date().toISOString();
    room.messages.push(
      {
        messageId,
        content,
        createdAt,
        senderType: "USER",
        generationStatus: "COMPLETED",
        recommendation: null,
      },
      {
        messageId: messageId + 1,
        content: "스타일링 요청을 확인했어요.",
        createdAt,
        senderType: "AI",
        generationStatus: null,
        recommendation: null,
      },
    );
    return success({
      chatRoomId: room.chatRoomId,
      messageId,
      content,
      createdAt,
    });
  }),
  http.get("*/chat-rooms/search", ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const keyword = searchParams.get("keyword")?.trim();

    if (!keyword) {
      return HttpResponse.json(
        {
          code: "INVALID_SEARCH_KEYWORD",
          data: null,
          message: "검색어를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    if (keyword.length > 100) {
      return HttpResponse.json(
        {
          code: "SEARCH_KEYWORD_LENGTH_EXCEEDED",
          data: null,
          message: "검색어는 최대 100자까지 입력할 수 있어요.",
        },
        { status: 400 },
      );
    }

    const normalizedKeyword = keyword.toLocaleLowerCase("ko-KR");
    const matches = chatSearchItems.filter(({ message }) =>
      message.toLocaleLowerCase("ko-KR").includes(normalizedKeyword),
    );

    const cursor = searchParams.get("cursor");
    const cursorIndex = matches.findIndex(
      ({ messageId }) => String(messageId) === cursor,
    );
    if (cursor != null && cursorIndex === -1) {
      return HttpResponse.json(
        {
          code: "INVALID_SEARCH_CURSOR",
          data: null,
          message: "잘못된 검색 커서입니다.",
        },
        { status: 400 },
      );
    }
    const remaining = matches.slice(cursorIndex + 1);
    const items = remaining.slice(0, Number(searchParams.get("size") ?? 20));
    const hasNext = remaining.length > items.length;

    return HttpResponse.json({
      code: "CHAT_ROOM_SEARCH_SUCCESS",
      data: {
        items,
        hasNext,
        nextCursor: hasNext ? (items.at(-1)?.messageId ?? null) : null,
      },
      message:
        items.length > 0
          ? "대화 검색 결과를 조회했습니다."
          : "일치하는 대화가 없습니다.",
    });
  }),
  http.get("*/chat-rooms", async ({ request }) => {
    const failure = await paginationFailure(request);
    if (failure) return failure;
    const cursor =
      Number(new URL(request.url).searchParams.get("cursor")) || 25;
    const items = Array.from(
      { length: Math.min(20, Math.max(0, cursor - 1)) },
      (_, index) => ({
        chatRoomId: cursor - index - 1,
        title: `테스트 대화 ${cursor - index - 1}`,
        lastMessageAt: "2026-11-04T00:00:00",
      }),
    );
    return success({
      items,
      nextCursor: cursor > 21 ? items.at(-1)!.chatRoomId : null,
      hasNext: cursor > 21,
    });
  }),
  ...["fitting-candidates", "wishlists"].map((endpoint) =>
    http.get(`*/${endpoint}`, async ({ request }) => {
      const url = new URL(request.url);
      const failure = await paginationFailure(request);
      if (failure) return failure;
      const size =
        Number(url.searchParams.get("size")) ||
        (endpoint === "wishlists" ? 20 : 10);
      const cursor = Number(url.searchParams.get("cursor")) || 0;
      const itemType = url.searchParams.get("itemType");
      const allItems = Array.from({ length: 100 }, (_, index) => {
        const id = index + 1;
        return {
          fittingCandidateId: id,
          wishlistId: id,
          productId: id,
          productName: `테스트 상품 ${id}`,
          productImageUrl: "/images/fixtures/virtual-fitting.png",
          itemType: index % 2 === 0 ? "TOP" : "BOTTOM",
          color: "네이비",
          currentPrice: 42000,
          wishedPrice: 42000,
          priceChangeRate: 0,
          purchaseUrl: "https://shop.example.com/products/101",
          wishedAt: "2026-11-04T00:00:00",
        };
      }).filter(
        (item) =>
          endpoint !== "fitting-candidates" ||
          !itemType ||
          item.itemType === itemType,
      );
      const remaining = allItems.filter((item) => item.productId > cursor);
      const items = remaining.slice(0, size);
      const hasNext = remaining.length > items.length;
      const nextCursor = hasNext ? items.at(-1)!.productId : null;
      return success({
        items,
        totalCount: allItems.length,
        hasNext,
        nextCursor,
      });
    }),
  ),

  http.get("*/notifications/stream", () => {
    const failed =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("mockNotification") ===
        "fail";
    const encoder = new TextEncoder();
    let notificationTimer: ReturnType<typeof setTimeout>;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'event: connected\ndata: {"code":"NOTIFICATION_STREAM_CONNECTED","data":{"unreadCount":0,"hasUnread":false},"message":"실시간 알림 연결이 완료되었습니다."}\n\n',
          ),
        );
        notificationTimer = setTimeout(() => {
          const type = failed ? "FITTING_FAIL" : "FITTING_SUCCESS";
          controller.enqueue(
            encoder.encode(
              `event: notification\ndata: {"code":"NOTIFICATION_RECEIVED","data":{"notificationId":52,"fittingJobId":123,"type":"${type}"},"message":"새 알림이 도착했습니다."}\n\n`,
            ),
          );
        }, 2000);
      },
      cancel() {
        clearTimeout(notificationTimer);
      },
    });

    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }),

  http.get("*/notifications/unread", () =>
    HttpResponse.json({
      code: "OK",
      data: { hasUnread: false },
      message: "요청이 성공적으로 처리되었습니다.",
    }),
  ),

  http.patch("*/notifications/:notificationId/read", () =>
    HttpResponse.json({
      code: "OK",
      data: { unreadCount: 0 },
      message: "요청이 성공적으로 처리되었습니다.",
    }),
  ),

  http.patch("*/notifications", () =>
    HttpResponse.json({
      code: "OK",
      data: { unreadCount: 0 },
      message: "요청이 성공적으로 처리되었습니다.",
    }),
  ),

  http.get("*/notifications", () =>
    HttpResponse.json({
      code: "NOTIFICATION_LIST_GET_SUCCESS",
      data: {
        items: [
          {
            notificationId: 52,
            type: "FITTING_SUCCESS",
            isRead: false,
            targetType: "FITTING_JOB",
            targetId: 123,
            payload: { outfitName: "가을 출근 니트 룩" },
            createdAt: "2026-10-16T17:20:00",
          },
          {
            notificationId: 51,
            type: "FITTING_FAIL",
            isRead: true,
            targetType: "FITTING_JOB",
            targetId: 122,
            payload: {},
            createdAt: "2026-10-16T16:10:00",
          },
        ],
        unreadCount: 1,
        nextCursor: null,
        hasNext: false,
      },
      message: "알림 목록을 조회했습니다.",
    }),
  ),

  http.get("*/products/rankings", ({ request }) => {
    const type = new URL(request.url).searchParams.get("type");

    if (type !== "WISH" && type !== "CLICK") {
      return HttpResponse.json(
        {
          code: "INVALID_RANKING_TYPE",
          data: null,
          message: "랭킹 기준이 필요합니다.",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      code: "PRODUCT_RANKING_GET_SUCCESS",
      data: {
        type,
        items: rankingCounts.map((rankingCount, index) => ({
          ...rankingItems[type][index % rankingItems[type].length],
          rank: index + 1,
          productId: 1000 + index,
          rankingCount,
        })),
      },
      message: "상품 랭킹을 조회했습니다.",
    });
  }),

  http.get("*/members/me", () => success({ profileCompleted })),

  http.get("*/members/me/profile", () => success(profile)),

  http.post("*/full-body-image/warmup", () =>
    HttpResponse.json(
      {
        code: "BODY_IMAGE_WARMUP_ACCEPTED",
        data: null,
        message: "전신 이미지 검증 사전 활성화 요청을 접수했습니다.",
      },
      { status: 202 },
    ),
  ),

  http.post("*/full-body-image/validate", () => {
    const appOrigin =
      typeof location === "undefined"
        ? "http://localhost:3000"
        : location.origin;
    validatedFullBodyImageUrl = new URL(
      "/images/profile/full-body-example.png",
      appOrigin,
    ).toString();

    return success({
      fullBodyImageUrl: validatedFullBodyImageUrl,
      validationId: 1,
    });
  }),

  http.post("*/members/me/profile", async ({ request }) => {
    const body = (await request.json()) as Partial<MockProfile> & {
      fullBodyImageValidationId?: number;
    };

    profile = {
      ...profile,
      age: body.age ?? null,
      fullBodyImageUrl: body.fullBodyImageValidationId
        ? validatedFullBodyImageUrl
        : null,
      height: body.height ?? null,
      name: body.name ?? profile.name,
      priceAlertEnabled: body.priceAlertEnabled ?? profile.priceAlertEnabled,
      weight: body.weight ?? null,
    };
    profileCompleted = true;

    return success({ profileId: 1 });
  }),

  http.patch("*/members/me/profile", async ({ request }) => {
    const body = (await request.json()) as MockProfileUpdate;
    const { fullBodyImageValidationId, ...profileUpdates } = body;

    if (fullBodyImageValidationId && !validatedFullBodyImageUrl) {
      return HttpResponse.json(
        {
          code: "INVALID_IMAGE",
          data: null,
          message: "검증된 사진이 필요합니다.",
        },
        { status: 400 },
      );
    }

    profile = {
      ...profile,
      ...profileUpdates,
      ...(fullBodyImageValidationId && {
        fullBodyImageUrl: validatedFullBodyImageUrl,
      }),
    };

    return success(null);
  }),

  http.get("*/fitting-jobs/current", () => {
    const mockStatus =
      typeof window === "undefined"
        ? "GENERATING"
        : new URLSearchParams(window.location.search).get("mockStatus");
    const status =
      mockStatus === "FAILED" || mockStatus === "COMPLETED"
        ? mockStatus
        : "GENERATING";

    return HttpResponse.json({
      code: "FITTING_CURRENT_JOB_FOUND",
      data: {
        fittingJobId: 123,
        status,
        createdAt: fittingJobCreatedAt,
        resultViewed: fittingResultViewed,
        products: [
          {
            productId: 101,
            itemType: "TOP",
            productName: "에센셜 램스울 크루넥",
            productImageUrl: "/images/fixtures/virtual-fitting.png",
          },
          {
            productId: 205,
            itemType: "BOTTOM",
            productName: "모던 테이퍼드 슬랙스",
            productImageUrl: "/images/fixtures/virtual-fitting.png",
          },
        ],
      },
      message: "최근 가상피팅 작업을 조회했습니다.",
    });
  }),

  http.get("*/fitting-jobs/:fittingJobId", ({ params }) => {
    if (params.fittingJobId !== "123") {
      return HttpResponse.json(
        {
          code: "FITTING_JOB_NOT_FOUND",
          data: null,
          message: "가상피팅 요청 정보를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    const mockStatus =
      typeof window === "undefined"
        ? "GENERATING"
        : new URLSearchParams(window.location.search).get("mockStatus");
    const status =
      mockStatus === "FAILED" || mockStatus === "COMPLETED"
        ? mockStatus
        : "GENERATING";

    return HttpResponse.json({
      code: "OK",
      data: {
        fittingJobId: 123,
        status,
        createdAt: fittingJobCreatedAt,
        result: null,
      },
      message: "요청이 성공적으로 처리되었습니다.",
    });
  }),

  http.get("*/fitting-jobs/:fittingJobId/result", ({ params }) => {
    if (params.fittingJobId !== "123") {
      return HttpResponse.json(
        {
          code: "FITTING_JOB_NOT_FOUND",
          data: null,
          message: "가상피팅 요청 정보를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      code: "FITTING_TEMP_RESULT_GET_SUCCESS",
      data: {
        fittingJobId: 123,
        resultViewed: fittingResultViewed,
        saved: fittingResultSaved,
        fittingResultId: fittingResultSaved ? 456 : null,
        resultImageUrl: "/images/profile/full-body-example.png",
        outfitName: fittingResultOutfitName,
        comment:
          "선택한 상·하의 조합이 자연스럽게 어우러져 데일리와 출근용으로 활용하기 좋아요.",
        products: [
          {
            productId: 101,
            itemType: "TOP",
            productName: "에센셜 램스울 크루넥",
            productImageUrl: "/images/fixtures/virtual-fitting.png",
            purchaseUrl: "https://shop.example.com/products/101",
          },
          {
            productId: 205,
            itemType: "BOTTOM",
            productName: "모던 테이퍼드 슬랙스",
            productImageUrl: "/images/fixtures/virtual-fitting.png",
            purchaseUrl: "https://shop.example.com/products/205",
          },
        ],
        expiresAt: "2026-10-14T16:30:00",
      },
      message: "가상피팅 결과를 조회했습니다.",
    });
  }),

  http.patch("*/fitting-jobs/:fittingJobId/result/viewed", ({ params }) => {
    if (params.fittingJobId !== "122" && params.fittingJobId !== "123") {
      return HttpResponse.json(
        {
          code: "FITTING_JOB_NOT_FOUND",
          data: null,
          message: "가상피팅 요청 정보를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    if (params.fittingJobId === "123") fittingResultViewed = true;

    return HttpResponse.json({
      code: "OK",
      data: { fittingJobId: Number(params.fittingJobId) },
      message: "가상피팅 결과를 확인 처리했습니다.",
    });
  }),

  http.post("*/fitting-results", async ({ request }) => {
    const body = (await request.json()) as {
      fittingJobId?: number;
      outfitName?: string;
    };

    if (body.fittingJobId !== 123 || !body.outfitName?.trim()) {
      return HttpResponse.json(
        {
          code: "INVALID_FITTING_RESULT_REQUEST",
          data: null,
          message: "저장할 가상피팅 결과 정보가 올바르지 않습니다.",
        },
        { status: 400 },
      );
    }

    fittingResultSaved = true;
    fittingResultOutfitName = body.outfitName.trim();

    return HttpResponse.json({
      code: "FITTING_RESULT_CREATE_SUCCESS",
      data: {
        fittingResultId: 456,
        outfitName: fittingResultOutfitName,
      },
      message: "가상피팅 결과를 저장했습니다.",
    });
  }),

  http.get("*/fitting-results/:fittingResultId", ({ params }) => {
    if (!fittingResultSaved || params.fittingResultId !== "456") {
      return HttpResponse.json(
        {
          code: "FITTING_RESULT_NOT_FOUND",
          data: null,
          message: "저장된 가상피팅 결과를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      code: "FITTING_RESULT_GET_SUCCESS",
      data: {
        fittingResultId: 456,
        resultImageUrl: "/images/profile/full-body-example.png",
        outfitName: fittingResultOutfitName,
        comment:
          "선택한 상·하의 조합이 자연스럽게 어우러져 데일리와 출근용으로 활용하기 좋아요.",
        products: [
          {
            productId: 101,
            itemType: "TOP",
            productName: "에센셜 램스울 크루넥",
            productImageUrl: "/images/fixtures/virtual-fitting.png",
            purchaseUrl: "https://shop.example.com/products/101",
          },
          {
            productId: 205,
            itemType: "BOTTOM",
            productName: "모던 테이퍼드 슬랙스",
            productImageUrl: "/images/fixtures/virtual-fitting.png",
            purchaseUrl: "https://shop.example.com/products/205",
          },
        ],
      },
      message: "저장된 가상피팅 결과를 조회했습니다.",
    });
  }),

  http.get("*/fitting-results", async ({ request }) => {
    if (paginationMode(request)) {
      const failure = await paginationFailure(request);
      if (failure) return failure;
      const cursor =
        Number(new URL(request.url).searchParams.get("cursor")) || 0;
      const items = Array.from(
        { length: Math.max(0, Math.min(10, 21 - cursor)) },
        (_, index) => ({
          fittingResultId: cursor + index + 1,
          resultImageUrl: "/images/fixtures/virtual-fitting.png",
          outfitName: `테스트 피팅 ${cursor + index + 1}`,
          savedAt: "2026-11-04T00:00:00",
        }),
      );
      const nextCursor = cursor + items.length;
      return success({
        items,
        totalCount: 21,
        hasNext: nextCursor < 21,
        nextCursor: nextCursor < 21 ? nextCursor : null,
      });
    }

    const items = fittingResultSaved
      ? [
          {
            fittingResultId: 456,
            resultImageUrl: "/images/profile/full-body-example.png",
            outfitName: fittingResultOutfitName,
            savedAt: "2026-10-14T10:00:00",
          },
        ]
      : [];

    return HttpResponse.json({
      code: "FITTING_RESULT_LIST_GET_SUCCESS",
      data: {
        items,
        totalCount: items.length,
        nextCursor: null,
        hasNext: false,
      },
      message: "저장된 가상피팅 결과 목록을 조회했습니다.",
    });
  }),
];

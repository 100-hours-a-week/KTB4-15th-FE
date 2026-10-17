import { http, HttpResponse, type RequestHandler } from "msw";

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

const rankingItems = {
  WISH: [
    {
      rank: 1,
      productId: 101,
      productName: "에센셜 램스울 크루넥",
      productImageUrl: "https://image.example.com/product101.jpg",
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

export const handlers: RequestHandler[] = [
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
      data: { hasUnread: true },
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

  http.get("*/notifications", () => {
    const empty =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("mockNotifications") ===
        "empty";

    return HttpResponse.json({
      code: "NOTIFICATION_LIST_GET_SUCCESS",
      data: {
        items: empty
          ? []
          : [
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
        unreadCount: empty ? 0 : 1,
        nextCursor: null,
        hasNext: false,
      },
      message: empty
        ? "알림 목록이 비어 있습니다."
        : "알림 목록을 조회했습니다.",
    });
  }),

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
      data: { type, items: rankingItems[type] },
      message: "상품 랭킹을 조회했습니다.",
    });
  }),

  http.get("*/members/me", () => success({ profileCompleted })),

  http.get("*/members/me/profile", () => success(profile)),

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
        resultViewed: fittingResultViewed,
        products: [
          {
            productId: 101,
            itemType: "TOP",
            productName: "에센셜 램스울 크루넥",
            productImageUrl: "/images/onboarding/virtual-fitting.png",
          },
          {
            productId: 205,
            itemType: "BOTTOM",
            productName: "모던 테이퍼드 슬랙스",
            productImageUrl: "/images/onboarding/virtual-fitting.png",
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
      data: { fittingJobId: 123, status, result: null },
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
            productImageUrl: "/images/onboarding/virtual-fitting.png",
            purchaseUrl: "https://shop.example.com/products/101",
          },
          {
            productId: 205,
            itemType: "BOTTOM",
            productName: "모던 테이퍼드 슬랙스",
            productImageUrl: "/images/onboarding/virtual-fitting.png",
            purchaseUrl: "https://shop.example.com/products/205",
          },
        ],
        expiresAt: "2026-10-14T16:30:00",
      },
      message: "가상피팅 결과를 조회했습니다.",
    });
  }),

  http.patch("*/fitting-jobs/:fittingJobId/result/viewed", ({ params }) => {
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

    fittingResultViewed = true;

    return HttpResponse.json({
      code: "OK",
      data: { fittingJobId: 123 },
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
            productImageUrl: "/images/onboarding/virtual-fitting.png",
            purchaseUrl: "https://shop.example.com/products/101",
          },
          {
            productId: 205,
            itemType: "BOTTOM",
            productName: "모던 테이퍼드 슬랙스",
            productImageUrl: "/images/onboarding/virtual-fitting.png",
            purchaseUrl: "https://shop.example.com/products/205",
          },
        ],
      },
      message: "저장된 가상피팅 결과를 조회했습니다.",
    });
  }),

  http.get("*/fitting-results", () => {
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

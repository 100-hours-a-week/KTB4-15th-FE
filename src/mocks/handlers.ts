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

let profileCompleted = false;
let validatedFullBodyImageUrl: string | null = null;
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
];

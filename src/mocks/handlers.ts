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

export const handlers: RequestHandler[] = [
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

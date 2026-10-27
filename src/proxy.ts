import { type NextRequest, NextResponse } from "next/server";
import { ONBOARDING_COOKIE_NAME } from "@/features/onboarding/model/onboarding-cookie";

const REQUEST_PATH_HEADER = "x-lookddak-request-path";
const REFRESH_ATTEMPT_HEADER = "x-lookddak-refresh-attempted";
const REFRESH_ATTEMPT_COOKIE = "lookddakRefreshAttempted";

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/onboarding" &&
    request.cookies.get(ONBOARDING_COOKIE_NAME)?.value === "true"
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    REQUEST_PATH_HEADER,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  const refreshAttempted = request.cookies.has(REFRESH_ATTEMPT_COOKIE);
  if (refreshAttempted) requestHeaders.set(REFRESH_ATTEMPT_HEADER, "1");

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (refreshAttempted) {
    response.cookies.set(REFRESH_ATTEMPT_COOKIE, "", {
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/onboarding",
    "/chat/:path*",
    "/fitting/:path*",
    "/fitting-results/:path*",
    "/mypage/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/ranking/:path*",
    "/wishlists/:path*",
  ],
};

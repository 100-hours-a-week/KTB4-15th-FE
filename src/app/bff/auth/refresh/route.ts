import { NextResponse } from "next/server";
import { forwardAuthRequest } from "../_lib/forward-auth-request";
import { getSafeReturnTo } from "../_lib/return-to";

const REFRESH_ATTEMPT_COOKIE = "lookddakRefreshAttempted";

function appendSetCookies(source: Response, target: NextResponse) {
  for (const cookie of source.headers.getSetCookie()) {
    target.headers.append("set-cookie", cookie);
  }
}

export async function POST(request: Request) {
  return forwardAuthRequest(request, "auth/refresh");
}

export async function GET(request: Request) {
  const refreshResponse = await forwardAuthRequest(request, "auth/refresh");

  if (!refreshResponse.ok) {
    if (refreshResponse.status !== 401) return refreshResponse;

    const loginResponse = NextResponse.redirect(
      new URL("/login?reason=session-expired", request.url),
      303,
    );
    appendSetCookies(refreshResponse, loginResponse);
    return loginResponse;
  }

  const response = NextResponse.redirect(
    new URL(getSafeReturnTo(request.url), request.url),
    303,
  );
  response.cookies.set(REFRESH_ATTEMPT_COOKIE, "1", {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60,
  });
  appendSetCookies(refreshResponse, response);

  return response;
}

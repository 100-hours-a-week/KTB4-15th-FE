import { type NextRequest, NextResponse } from "next/server";
import { forwardAuthRequest } from "../_lib/forward-auth-request";
import { getSafeReturnTo, isSecureRequest } from "../_lib/return-to";

const REFRESH_ATTEMPT_COOKIE = "lookddakRefreshAttempted";

function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}

function appendSetCookies(source: Response, target: NextResponse) {
  for (const cookie of source.headers.getSetCookie()) {
    target.headers.append("set-cookie", cookie);
  }
}

export async function POST(request: Request) {
  return forwardAuthRequest(request, "auth/refresh");
}

export async function GET(request: NextRequest) {
  const returnTo = getSafeReturnTo(request.url);
  const loginQuery = new URLSearchParams({ returnTo });
  if (!request.cookies.get("refreshToken")?.value) {
    return redirectTo(`/login?${loginQuery}`);
  }

  const refreshResponse = await forwardAuthRequest(request, "auth/refresh");

  if (!refreshResponse.ok) {
    if (refreshResponse.status !== 401) return refreshResponse;

    loginQuery.set("reason", "session-expired");
    const loginResponse = redirectTo(`/login?${loginQuery}`);
    appendSetCookies(refreshResponse, loginResponse);
    return loginResponse;
  }

  const response = redirectTo(returnTo);
  response.cookies.set(REFRESH_ATTEMPT_COOKIE, "1", {
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax",
    path: "/",
    maxAge: 60,
  });
  appendSetCookies(refreshResponse, response);

  return response;
}

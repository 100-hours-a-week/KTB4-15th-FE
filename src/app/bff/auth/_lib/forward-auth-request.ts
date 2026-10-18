const API_BASE_URL = process.env.API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not defined");
}

export async function forwardAuthRequest(request: Request, path: string) {
  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(new URL(path, API_BASE_URL), {
      method: "POST",
      headers: {
        Cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return Response.json(
      { message: "인증 서버에 연결할 수 없습니다." },
      { status: 502 },
    );
  }

  const headers = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");

  if (contentType) headers.set("content-type", contentType);
  for (const cookie of upstreamResponse.headers.getSetCookie()) {
    headers.append("set-cookie", cookie);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}

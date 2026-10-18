import assert from "node:assert/strict";
import test from "node:test";

process.env.API_BASE_URL = "https://spring.example.com/api/v1/";

const { forwardAuthRequest } =
  await import("../../src/app/bff/auth/_lib/forward-auth-request.ts");

test("POST /bff/auth/refresh forwards cookies and Set-Cookie headers", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamRequest: Request | undefined;

  globalThis.fetch = async (input, init) => {
    upstreamRequest = new Request(input, init);
    const headers = new Headers({ "content-type": "application/json" });
    headers.append("set-cookie", "accessToken=new-access; Path=/; HttpOnly");
    headers.append(
      "set-cookie",
      "refreshToken=new-refresh; Path=/bff/auth; HttpOnly",
    );

    return new Response('{"code":"OK"}', { status: 200, headers });
  };

  try {
    const response = await forwardAuthRequest(
      new Request("https://lookddak.com/bff/auth/refresh", {
        method: "POST",
        headers: { cookie: "refreshToken=old-refresh" },
      }),
      "auth/refresh",
    );

    assert.equal(
      upstreamRequest?.url,
      "https://spring.example.com/api/v1/auth/refresh",
    );
    assert.equal(upstreamRequest?.method, "POST");
    assert.equal(
      upstreamRequest?.headers.get("cookie"),
      "refreshToken=old-refresh",
    );
    assert.equal(response.status, 200);
    assert.deepEqual(response.headers.getSetCookie(), [
      "accessToken=new-access; Path=/; HttpOnly",
      "refreshToken=new-refresh; Path=/bff/auth; HttpOnly",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("POST /bff/auth/refresh returns 502 when Spring is unreachable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("connection failed");
  };

  try {
    const response = await forwardAuthRequest(
      new Request("https://lookddak.com/bff/auth/refresh", {
        method: "POST",
      }),
      "auth/refresh",
    );

    assert.equal(response.status, 502);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

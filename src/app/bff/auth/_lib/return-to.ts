export function normalizeReturnTo(returnTo: unknown) {
  if (
    typeof returnTo !== "string" ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//")
  ) {
    return;
  }

  const origin = "https://internal.invalid";
  const target = URL.parse(returnTo, origin);
  if (!target || target.origin !== origin || target.pathname.startsWith("//")) {
    return;
  }
  return `${target.pathname}${target.search}`;
}

export function getSafeReturnTo(requestUrl: string) {
  return (
    normalizeReturnTo(new URL(requestUrl).searchParams.get("returnTo")) ?? "/"
  );
}

export function isSecureRequest(request: Request) {
  return (
    request.headers.get("x-forwarded-proto") === "https" ||
    new URL(request.url).protocol === "https:"
  );
}

export function getSafeReturnTo(requestUrl: string) {
  const url = new URL(requestUrl);
  const returnTo = url.searchParams.get("returnTo");

  if (!returnTo?.startsWith("/") || returnTo.startsWith("//")) return "/";

  const target = new URL(returnTo, url.origin);
  if (target.origin !== url.origin) return "/";

  return `${target.pathname}${target.search}`;
}

export function isSecureRequest(request: Request) {
  return (
    request.headers.get("x-forwarded-proto") === "https" ||
    new URL(request.url).protocol === "https:"
  );
}

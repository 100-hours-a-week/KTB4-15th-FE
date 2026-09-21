import 'server-only';

import { cookies } from 'next/headers';

const API_BASE_URL = process.env.API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('API_BASE_URL is not defined');
}

export async function serverApi(
  path: string,
  init: RequestInit = {},
) {
  const cookieStore = await cookies();

  const response = await fetch(
    new URL(path, API_BASE_URL),
    {
      ...init,
      headers: {
        ...init.headers,
        Cookie: cookieStore.toString(),
      },
      signal: init.signal ?? AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response;
}
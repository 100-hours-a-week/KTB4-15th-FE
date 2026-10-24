import "server-only";

import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { parseResponse } from "@/shared/api/response";
import { serverApi, ServerApiError } from "@/shared/api/server";
import { getServerApiBaseUrl } from "@/shared/api/server-config";
import { productRankingSchema, type RankingType } from "../schema/ranking";

export async function getProductRankingsServer(type: RankingType) {
  await serverApi("members/me", { cache: "no-store" });

  const cookieHeader = (await cookies()).toString();
  const url = new URL(`products/rankings?type=${type}`, getServerApiBaseUrl());

  // 사용자와 무관한 성공 데이터만 공유하므로 인증 쿠키는 캐시 키에서 제외한다.
  return unstable_cache(
    async () => {
      const response = await fetch(url, {
        cache: "no-store",
        headers: { Cookie: cookieHeader },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new ServerApiError(response.status);

      return parseResponse(response, productRankingSchema);
    },
    ["product-rankings-v1", url.toString()],
    { revalidate: 300 },
  )();
}

import "server-only";

import { parseResponse } from "@/shared/api/response";
import { serverApi } from "@/shared/api/server";
import { productRankingSchema, type RankingType } from "../schema/ranking";

export async function getProductRankingsServer(type: RankingType) {
  const response = await serverApi(`products/rankings?type=${type}`, {
    cache: "no-store",
  });
  return parseResponse(response, productRankingSchema);
}

import { apiClient } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/response";
import { productRankingSchema, type RankingType } from "../schema/ranking";

export async function getProductRankings(type: RankingType) {
  const response = await apiClient.get("products/rankings", {
    searchParams: { type },
  });

  return parseResponse(response, productRankingSchema);
}

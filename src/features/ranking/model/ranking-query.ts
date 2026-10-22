import { queryOptions } from "@tanstack/react-query";
import { getProductRankings } from "../api/ranking";
import type { RankingType } from "../schema/ranking";

export const rankingQueryKeys = {
  list: (type: RankingType) => ["products", "rankings", type] as const,
};

export const productRankingQueryOptions = (type: RankingType) =>
  queryOptions({
    queryKey: rankingQueryKeys.list(type),
    queryFn: () => getProductRankings(type),
  });

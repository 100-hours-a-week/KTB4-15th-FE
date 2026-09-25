import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getFittingCandidates,
  type FittingCandidateItemType,
} from "./fitting-candidate";

export function useFittingCandidatesQuery(itemType?: FittingCandidateItemType) {
  return useInfiniteQuery({
    queryKey: ["fitting-candidates", "infinite", itemType ?? "ALL"],
    queryFn: ({ pageParam }) =>
      getFittingCandidates({ cursor: pageParam, itemType, size: 20 }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
  });
}

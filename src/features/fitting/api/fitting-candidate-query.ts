import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteFittingCandidates,
  getFittingCandidates,
  type FittingCandidateItemType,
} from "./fitting-candidate";

export const FITTING_CANDIDATES_QUERY_KEY = ["fitting-candidates"] as const;

export function useFittingCandidatesQuery(itemType?: FittingCandidateItemType) {
  return useInfiniteQuery({
    queryKey: [...FITTING_CANDIDATES_QUERY_KEY, "infinite", itemType ?? "ALL"],
    queryFn: ({ pageParam }) =>
      getFittingCandidates({ cursor: pageParam, itemType, size: 20 }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
  });
}

export function useDeleteFittingCandidatesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFittingCandidates,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: FITTING_CANDIDATES_QUERY_KEY,
      }),
  });
}

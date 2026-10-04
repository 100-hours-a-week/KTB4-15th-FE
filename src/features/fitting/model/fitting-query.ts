import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteFittingCandidates,
  getFittingCandidates,
  type FittingCandidateItemType,
} from "../api/fitting-candidate";
import { getFittingJobStatus } from "../api/fitting-job";

export const fittingQueryKeys = {
  candidateListRoot: ["fitting", "candidates"] as const,
  candidateList: (itemType?: FittingCandidateItemType) =>
    [...fittingQueryKeys.candidateListRoot, itemType ?? "all"] as const,
  job: (fittingJobId: number) => ["fitting", "job", fittingJobId] as const,
};

export const fittingCandidatesQueryOptions = (
  itemType?: FittingCandidateItemType,
) =>
  infiniteQueryOptions({
    queryKey: fittingQueryKeys.candidateList(itemType),
    queryFn: ({ pageParam }) =>
      getFittingCandidates({ cursor: pageParam, itemType, size: 20 }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
  });

export const fittingJobQueryOptions = (fittingJobId: number) =>
  queryOptions({
    queryKey: fittingQueryKeys.job(fittingJobId),
    queryFn: () => getFittingJobStatus(fittingJobId),
    refetchInterval: (query) =>
      query.state.data?.status === "GENERATING" ? 3_000 : false,
    refetchOnWindowFocus: true,
  });

export function useDeleteFittingCandidatesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFittingCandidates,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: fittingQueryKeys.candidateListRoot,
      }),
  });
}

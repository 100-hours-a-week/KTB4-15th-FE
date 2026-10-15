import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createFittingCandidate,
  deleteFittingCandidates,
  getFittingCandidates,
} from "../api/fitting-candidate";
import type { ProductItemType } from "@/shared/schema/product";
import {
  getCurrentFittingJob,
  getFittingTempResult,
  markFittingResultViewed,
} from "../api/fitting-job";
import {
  createFittingResult,
  deleteFittingResult,
  getFittingResult,
  getFittingResults,
  updateFittingResultOutfitName,
} from "../api/fitting-result";

export const fittingQueryKeys = {
  candidateListRoot: ["fitting", "candidates"] as const,
  candidateList: (itemType?: ProductItemType) =>
    [...fittingQueryKeys.candidateListRoot, itemType ?? "all"] as const,
  currentJob: ["fitting", "job", "current"] as const,
  tempResult: (fittingJobId: number) =>
    ["fitting", "job", fittingJobId, "result"] as const,
  resultRoot: ["fitting", "results"] as const,
  resultList: ["fitting", "results", "list"] as const,
  resultDetail: (fittingResultId: number) =>
    ["fitting", "results", "detail", fittingResultId] as const,
};

export const currentFittingJobQueryOptions = queryOptions({
  queryKey: fittingQueryKeys.currentJob,
  queryFn: getCurrentFittingJob,
});

export const fittingCandidatesQueryOptions = (itemType?: ProductItemType) =>
  infiniteQueryOptions({
    queryKey: fittingQueryKeys.candidateList(itemType),
    queryFn: ({ pageParam }) =>
      getFittingCandidates({ cursor: pageParam, itemType, size: 20 }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
  });

export const fittingTempResultQueryOptions = (fittingJobId: number) =>
  queryOptions({
    queryKey: fittingQueryKeys.tempResult(fittingJobId),
    queryFn: () => getFittingTempResult(fittingJobId),
  });

export const fittingResultListQueryOptions = infiniteQueryOptions({
  queryKey: fittingQueryKeys.resultList,
  queryFn: ({ pageParam }) =>
    getFittingResults({ cursor: pageParam, size: 20 }),
  initialPageParam: undefined as number | undefined,
  getNextPageParam: (lastPage) =>
    lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
});

export const fittingResultDetailQueryOptions = (fittingResultId: number) =>
  queryOptions({
    queryKey: fittingQueryKeys.resultDetail(fittingResultId),
    queryFn: () => getFittingResult(fittingResultId),
  });

export function useCreateFittingCandidateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFittingCandidate,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: fittingQueryKeys.candidateListRoot,
      }),
  });
}

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

function useInvalidateFittingResults() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: fittingQueryKeys.resultRoot });
}

export function useCreateFittingResultMutation() {
  const invalidate = useInvalidateFittingResults();

  return useMutation({
    mutationFn: createFittingResult,
    onSuccess: invalidate,
  });
}

export function useMarkFittingResultViewedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markFittingResultViewed,
    onSuccess: (_, fittingJobId) => {
      queryClient.setQueryData(
        currentFittingJobQueryOptions.queryKey,
        (currentJob) =>
          currentJob?.fittingJobId === fittingJobId
            ? { ...currentJob, resultViewed: true }
            : currentJob,
      );
      queryClient.setQueryData(
        fittingTempResultQueryOptions(fittingJobId).queryKey,
        (result) => result && { ...result, resultViewed: true },
      );
    },
  });
}

export function useUpdateFittingResultOutfitNameMutation() {
  const invalidate = useInvalidateFittingResults();

  return useMutation({
    mutationFn: updateFittingResultOutfitName,
    onSuccess: invalidate,
  });
}

export function useDeleteFittingResultMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFittingResult,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: fittingQueryKeys.resultList }),
  });
}

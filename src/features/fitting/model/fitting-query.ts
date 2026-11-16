import {
  WARDROBE_PAGE_SIZE,
  type FittingCandidate,
  type FittingCandidateListResponse,
} from "../schema/fitting-candidate";
import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import {
  createFittingCandidate,
  deleteFittingCandidates,
  getFittingCandidates,
} from "../api/fitting-candidate";
import { ApiError } from "@/shared/api/error";
import type { ProductItemType } from "@/shared/schema/product";
import {
  getCurrentFittingJob,
  getFittingJobStatus,
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

import { fittingQueryKeys } from "./fitting-query-keys";

export { fittingQueryKeys } from "./fitting-query-keys";

export const currentFittingJobQueryOptions = queryOptions({
  queryKey: fittingQueryKeys.currentJob,
  queryFn: getCurrentFittingJob,
});

export const fittingJobQueryOptions = (fittingJobId: number) =>
  queryOptions({
    queryKey: fittingQueryKeys.job(fittingJobId),
    queryFn: () => getFittingJobStatus(fittingJobId),
    refetchInterval: ({ state }) =>
      state.data?.status === "GENERATING" ? 5_000 : false,
  });

export const fittingCandidatesQueryOptions = (itemType?: ProductItemType) =>
  infiniteQueryOptions({
    queryKey: fittingQueryKeys.candidateList(itemType),
    queryFn: async ({ client, pageParam, signal }) => {
      const sources = itemType ? [undefined, itemType] : [undefined];
      for (const source of sources) {
        const selection = reusableSelection(
          client,
          source,
          source !== itemType,
        );
        if (!selection) continue;

        try {
          const candidates = await selection;
          signal.throwIfAborted();
          const items = itemType
            ? candidates.filter((product) => product.itemType === itemType)
            : candidates;
          const cursorIndex = items.findIndex(
            (product) => product.fittingCandidateId === pageParam,
          );
          if (pageParam !== undefined && cursorIndex === -1) continue;
          const start = cursorIndex + 1;
          const page = items.slice(start, start + WARDROBE_PAGE_SIZE);
          const hasNext = start + page.length < items.length;
          return {
            items: page,
            totalCount: items.length,
            hasNext,
            nextCursor: hasNext
              ? (page.at(-1)?.fittingCandidateId ?? null)
              : null,
          };
        } catch {
          signal.throwIfAborted();
        }
      }

      return getFittingCandidates({
        cursor: pageParam,
        itemType,
        size: WARDROBE_PAGE_SIZE,
        signal,
      });
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
  });

const SELECT_ALL_PAGE_SIZE = 100;
const SELECTION_STALE_TIME = 30_000;

export const fittingCandidatesForSelectionQueryOptions = (
  itemType?: ProductItemType,
) => {
  const queryKey = fittingQueryKeys.candidateList(itemType);

  return queryOptions({
    queryKey: [...queryKey, "selection"],
    staleTime: SELECTION_STALE_TIME,
    queryFn: async ({ client, signal }): Promise<FittingCandidate[]> => {
      if (itemType) {
        const all = await reusableSelection(client, undefined, true)?.catch(
          () => undefined,
        );
        signal.throwIfAborted();
        if (all) return all.filter((product) => product.itemType === itemType);
      }

      const cached =
        client.getQueryState<InfiniteData<FittingCandidateListResponse>>(
          queryKey,
        );
      const pages =
        !cached?.isInvalidated &&
        cached?.data &&
        Date.now() - cached.dataUpdatedAt < SELECTION_STALE_TIME
          ? cached.data.pages
          : [
              await getFittingCandidates({
                itemType,
                size: SELECT_ALL_PAGE_SIZE,
                signal,
              }),
            ];
      const candidates = pages.flatMap((page) => page.items);
      let page = pages.at(-1);
      const seenCursors = new Set<number>();
      while (page?.hasNext) {
        const cursor = page.nextCursor;
        if (cursor == null || seenCursors.has(cursor)) {
          throw new Error("Invalid wardrobe cursor");
        }
        seenCursors.add(cursor);
        page = await getFittingCandidates({
          cursor,
          itemType,
          size: SELECT_ALL_PAGE_SIZE,
          signal,
        });
        candidates.push(...page.items);
      }
      return candidates;
    },
  });
};

function reusableSelection(
  client: QueryClient,
  itemType: ProductItemType | undefined,
  reuseCompleteList: boolean,
): Promise<FittingCandidate[]> | undefined {
  const selection = fittingCandidatesForSelectionQueryOptions(itemType);
  const state = client.getQueryState(selection.queryKey);
  if (
    state &&
    !state.isInvalidated &&
    (state.fetchStatus === "fetching" ||
      (state.data && Date.now() - state.dataUpdatedAt < SELECTION_STALE_TIME))
  ) {
    return client.fetchQuery(selection);
  }

  if (!reuseCompleteList) return;
  const list = client.getQueryState<InfiniteData<FittingCandidateListResponse>>(
    fittingQueryKeys.candidateList(itemType),
  );
  if (
    list?.data &&
    !list.isInvalidated &&
    Date.now() - list.dataUpdatedAt < SELECTION_STALE_TIME &&
    list.data.pages.at(-1)?.hasNext === false
  ) {
    return Promise.resolve(list.data.pages.flatMap((page) => page.items));
  }
}

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
    onSuccess: async () => {
      await queryClient.cancelQueries({
        queryKey: fittingQueryKeys.candidateListRoot,
        type: "inactive",
      });
      await queryClient.invalidateQueries({
        queryKey: fittingQueryKeys.candidateListRoot,
      });
    },
  });
}

export function useDeleteFittingCandidatesMutation(
  onSelectionRefresh: (candidates: FittingCandidate[]) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFittingCandidates,
    onError: async (error) => {
      if (
        !(error instanceof ApiError) ||
        error.code !== "FITTING_CANDIDATE_NOT_FOUND"
      )
        return;
      await queryClient.cancelQueries({
        queryKey: fittingQueryKeys.candidateListRoot,
      });
      await queryClient.invalidateQueries({
        queryKey: fittingQueryKeys.candidateListRoot,
        refetchType: "none",
      });
      try {
        const candidates = await queryClient.fetchQuery(
          fittingCandidatesForSelectionQueryOptions(),
        );
        onSelectionRefresh(candidates);
        await queryClient.invalidateQueries({
          queryKey: fittingQueryKeys.candidateListRoot,
          predicate: (query) => query.queryKey.at(-1) !== "selection",
        });
      } catch {
        // 재조회가 실패하면 선택을 유지하고 다음 수동 재시도에서 다시 확인한다.
      }
    },
    onSuccess: async () => {
      await queryClient.cancelQueries({
        queryKey: fittingQueryKeys.candidateListRoot,
        type: "inactive",
      });
      await queryClient.invalidateQueries({
        queryKey: fittingQueryKeys.candidateListRoot,
      });
    },
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

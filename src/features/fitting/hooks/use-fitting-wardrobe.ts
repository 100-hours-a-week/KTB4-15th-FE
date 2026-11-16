import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useScrollPagination } from "@/shared/hooks/use-scroll-pagination";
import type { ProductItemType } from "@/shared/schema/product";
import {
  fittingCandidatesForSelectionQueryOptions,
  fittingCandidatesQueryOptions,
  useDeleteFittingCandidatesMutation,
} from "../model/fitting-query";
import {
  type FittingCandidate,
  type FittingCandidateListResponse,
} from "../schema/fitting-candidate";
import { useFittingSelectionStore } from "../store/fitting-selection-store";
import { useRestoreFittingSelection } from "../store/use-restore-fitting-selection";

export type WardrobeFilter = ProductItemType | "ALL";

export function useFittingWardrobe(
  initialFilter: WardrobeFilter,
  initialCandidates?: FittingCandidateListResponse,
) {
  useRestoreFittingSelection();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<WardrobeFilter>(initialFilter);
  const [isEditing, setIsEditing] = useState(false);
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [selectAllFailed, setSelectAllFailed] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<
    Map<number, FittingCandidate>
  >(new Map());
  const itemType = filter === "ALL" ? undefined : filter;
  const query = useInfiniteQuery({
    ...fittingCandidatesQueryOptions(itemType),
    initialData:
      filter === initialFilter && initialCandidates
        ? { pages: [initialCandidates], pageParams: [undefined] }
        : undefined,
    staleTime:
      filter === initialFilter && initialCandidates ? 30_000 : undefined,
  });
  const { data, fetchNextPage, hasNextPage, isError } = query;
  useEffect(() => {
    if (isEditing && hasNextPage) {
      void queryClient.prefetchQuery(
        fittingCandidatesForSelectionQueryOptions(itemType),
      );
    }
  }, [hasNextPage, isEditing, itemType, queryClient]);
  const loadMoreRef = useScrollPagination({
    enabled: Boolean(hasNextPage) && !isError,
    isFetching: query.isFetching,
    fetchNextPage,
  });
  const top = useFittingSelectionStore((state) => state.top);
  const bottom = useFittingSelectionStore((state) => state.bottom);
  const clearProduct = useFittingSelectionStore((state) => state.clearProduct);

  const deleteMutation = useDeleteFittingCandidatesMutation();
  const selectedCount = Number(Boolean(top)) + Number(Boolean(bottom));
  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const firstImageCandidateId = products.find(
    (product) => product.productImageUrl,
  )?.fittingCandidateId;
  const isInitialError = isError && data == null;
  const totalCount = data?.pages[0]?.totalCount ?? products.length;
  const selectedInFilter = [...selectedForDelete.values()].filter(
    (product) => filter === "ALL" || product.itemType === filter,
  );
  const isAllSelected =
    totalCount > 0 &&
    selectedInFilter.length === totalCount &&
    products.every((product) =>
      selectedForDelete.has(product.fittingCandidateId),
    );

  const changeFilter = (nextFilter: WardrobeFilter) => {
    setSelectAllFailed(false);
    setFilter(nextFilter);
    window.history.replaceState(
      null,
      "",
      nextFilter === "ALL"
        ? "/fitting/wardrobe"
        : `/fitting/wardrobe?itemType=${nextFilter}`,
    );
  };

  const toggleEditing = () => {
    setSelectAllFailed(false);
    setIsEditing((editing) => !editing);
    setSelectedForDelete(new Map());
  };

  const toggleDeleteCandidate = (candidateId: number) => {
    const product = products.find(
      (item) => item.fittingCandidateId === candidateId,
    );
    if (!product) return;

    setSelectedForDelete((current) => {
      const next = new Map(current);

      if (next.has(candidateId)) next.delete(candidateId);
      else next.set(candidateId, product);

      return next;
    });
  };

  const toggleAll = async () => {
    if (isSelectingAll || totalCount === 0) return;
    setSelectAllFailed(false);
    if (isAllSelected) {
      setSelectedForDelete((current) => {
        const next = new Map(current);
        selectedInFilter.forEach((product) =>
          next.delete(product.fittingCandidateId),
        );
        return next;
      });
      return;
    }

    setIsSelectingAll(true);
    try {
      const candidates = data?.pages.at(-1)?.hasNext
        ? await queryClient.fetchQuery(
            fittingCandidatesForSelectionQueryOptions(itemType),
          )
        : products;
      setSelectedForDelete((current) => {
        const next = new Map(current);
        candidates.forEach((product) =>
          next.set(product.fittingCandidateId, product),
        );
        return next;
      });
    } catch {
      setSelectAllFailed(true);
    } finally {
      setIsSelectingAll(false);
    }
  };

  const deleteSelectedCandidates = (onSuccess: () => void) => {
    const candidateIds = [...selectedForDelete.keys()];
    if (candidateIds.length === 0) return;

    deleteMutation.mutate(candidateIds, {
      onSuccess: () => {
        if (top && candidateIds.includes(top.fittingCandidateId)) {
          clearProduct("TOP");
        }
        if (bottom && candidateIds.includes(bottom.fittingCandidateId)) {
          clearProduct("BOTTOM");
        }
        setSelectedForDelete(new Map());
        onSuccess();
      },
    });
  };

  return {
    filter,
    changeFilter,
    isEditing,
    toggleEditing,
    query,
    products,
    firstImageCandidateId,
    isInitialError,
    totalCount,
    selectedCount,
    selectedForDelete,
    selectedInFilterCount: selectedInFilter.length,
    isAllSelected,
    isSelectingAll,
    selectAllFailed,
    toggleDeleteCandidate,
    toggleAll,
    deleteSelectedCandidates,
    deleteMutation,
    loadMoreRef,
    completeSelection: () => router.push("/fitting"),
  };
}

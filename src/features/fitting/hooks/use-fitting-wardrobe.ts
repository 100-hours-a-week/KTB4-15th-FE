import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ProductItemType } from "@/shared/schema/product";
import {
  fittingCandidatesQueryOptions,
  useDeleteFittingCandidatesMutation,
} from "../model/fitting-query";
import { type FittingCandidateListResponse } from "../schema/fitting-candidate";
import { useFittingSelectionStore } from "../store/fitting-selection-store";
import { useRestoreFittingSelection } from "../store/use-restore-fitting-selection";

export type WardrobeFilter = ProductItemType | "ALL";

export function useFittingWardrobe(
  initialFilter: WardrobeFilter,
  initialCandidates?: FittingCandidateListResponse,
) {
  useRestoreFittingSelection();
  const router = useRouter();
  const [filter, setFilter] = useState<WardrobeFilter>(initialFilter);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<number>>(
    new Set(),
  );
  const query = useInfiniteQuery({
    ...fittingCandidatesQueryOptions(filter === "ALL" ? undefined : filter),
    initialData:
      filter === initialFilter && initialCandidates
        ? { pages: [initialCandidates], pageParams: [undefined] }
        : undefined,
    staleTime:
      filter === initialFilter && initialCandidates ? 30_000 : undefined,
  });
  const { data, fetchNextPage, hasNextPage, isError, isFetchingNextPage } =
    query;
  const loadMoreRef = useRef<HTMLDivElement>(null);
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
  const visibleCandidateIds = products.map(
    (product) => product.fittingCandidateId,
  );
  const isAllVisibleSelected =
    visibleCandidateIds.length > 0 &&
    visibleCandidateIds.every((id) => selectedForDelete.has(id));

  const changeFilter = (nextFilter: WardrobeFilter) => {
    setFilter(nextFilter);
    router.replace(
      nextFilter === "ALL"
        ? "/fitting/wardrobe"
        : `/fitting/wardrobe?itemType=${nextFilter}`,
      { scroll: false },
    );
  };

  const toggleEditing = () => {
    setIsEditing((editing) => !editing);
    setSelectedForDelete(new Set());
  };

  const toggleDeleteCandidate = (candidateId: number) => {
    setSelectedForDelete((current) => {
      const next = new Set(current);

      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);

      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedForDelete((current) => {
      const next = new Set(current);

      if (isAllVisibleSelected) {
        visibleCandidateIds.forEach((id) => next.delete(id));
      } else {
        visibleCandidateIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const deleteSelectedCandidates = () => {
    const candidateIds = [...selectedForDelete];
    if (candidateIds.length === 0) return;

    deleteMutation.mutate(candidateIds, {
      onSuccess: () => {
        if (top && candidateIds.includes(top.fittingCandidateId)) {
          clearProduct("TOP");
        }
        if (bottom && candidateIds.includes(bottom.fittingCandidateId)) {
          clearProduct("BOTTOM");
        }
        setSelectedForDelete(new Set());
      },
    });
  };

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasNextPage || isError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isError]);

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
    isAllVisibleSelected,
    toggleDeleteCandidate,
    toggleAllVisible,
    deleteSelectedCandidates,
    deleteMutation,
    loadMoreRef,
    completeSelection: () => router.push("/fitting"),
  };
}

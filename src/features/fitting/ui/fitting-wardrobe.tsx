"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/shared/utils/price-format";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import {
  BackIcon,
  CheckIcon,
  DeleteIcon,
  HeartIcon,
  InfoIcon,
} from "@/shared/ui/icon";
import {
  useDeleteFittingCandidatesMutation,
  useFittingCandidatesQuery,
} from "../api/fitting-candidate-query";
import { useFittingSelectionStore } from "../model/fitting-selection-store";
import type { FittingCandidate } from "../schema/fitting-candidate";
import styles from "./fitting-wardrobe.module.scss";

type WardrobeFilter = "TOP" | "BOTTOM" | "ALL";

type FittingWardrobeProps = {
  initialFilter: WardrobeFilter;
};

const FILTERS: Array<{ label: string; value: WardrobeFilter }> = [
  { label: "상의", value: "TOP" },
  { label: "하의", value: "BOTTOM" },
  { label: "전체", value: "ALL" },
];

function passthroughImageLoader({ src }: ImageLoaderProps) {
  return src;
}

type CandidateCardProps = {
  isEditing: boolean;
  isSelectedForDelete: boolean;
  onToggleDelete: (candidateId: number) => void;
  product: FittingCandidate;
};

function CandidateCard({
  isEditing,
  isSelectedForDelete,
  onToggleDelete,
  product,
}: CandidateCardProps) {
  const selectedProductId = useFittingSelectionStore((state) =>
    product.itemType === "TOP" ? state.top?.productId : state.bottom?.productId,
  );
  const selectProduct = useFittingSelectionStore(
    (state) => state.selectProduct,
  );
  const isSelected = isEditing
    ? isSelectedForDelete
    : selectedProductId === product.productId;

  return (
    <button
      aria-pressed={isSelected}
      className={`${styles.productCard} ${isSelected ? (isEditing ? styles.selectedForDelete : styles.selected) : ""}`}
      onClick={() =>
        isEditing
          ? onToggleDelete(product.fittingCandidateId)
          : selectProduct(product)
      }
      type="button"
    >
      <span className={styles.imageArea}>
        <Image
          alt=""
          className={styles.productImage}
          fill
          loader={passthroughImageLoader}
          sizes="72px"
          src={product.productImageUrl}
        />
      </span>
      <span className={styles.productDetails}>
        <small>{product.color}</small>
        <strong>{product.productName}</strong>
        <b>{formatPrice(product.currentPrice)}</b>
      </span>
      <span aria-hidden="true" className={styles.selectionMark}>
        {isSelected && <CheckIcon />}
      </span>
    </button>
  );
}

function EmptyCandidateCard({ itemType }: { itemType: "TOP" | "BOTTOM" }) {
  const selectedProduct = useFittingSelectionStore((state) =>
    itemType === "TOP" ? state.top : state.bottom,
  );
  const clearProduct = useFittingSelectionStore((state) => state.clearProduct);
  const isSelected = selectedProduct === null;
  const label = itemType === "TOP" ? "상의" : "하의";

  return (
    <button
      aria-pressed={isSelected}
      className={`${styles.productCard} ${isSelected ? styles.selected : ""}`}
      onClick={() => clearProduct(itemType)}
      type="button"
    >
      <span className={`${styles.imageArea} ${styles.emptyImageArea}`}>
        <HeartIcon />
      </span>
      <span className={styles.productDetails}>
        <small>{label}</small>
        <strong>선택 안 함</strong>
        <span>기본 상품으로 피팅해요</span>
      </span>
      <span aria-hidden="true" className={styles.selectionMark}>
        {isSelected && <CheckIcon />}
      </span>
    </button>
  );
}

export function FittingWardrobe({ initialFilter }: FittingWardrobeProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<WardrobeFilter>(initialFilter);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<number>>(
    new Set(),
  );
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isPending,
  } = useFittingCandidatesQuery(filter === "ALL" ? undefined : filter);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const top = useFittingSelectionStore((state) => state.top);
  const bottom = useFittingSelectionStore((state) => state.bottom);
  const clearProduct = useFittingSelectionStore((state) => state.clearProduct);
  const deleteMutation = useDeleteFittingCandidatesMutation();
  const selectedCount = Number(Boolean(top)) + Number(Boolean(bottom));
  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? products.length;
  const visibleCandidateIds = products.map(
    (product) => product.fittingCandidateId,
  );
  const isAllVisibleSelected =
    visibleCandidateIds.length > 0 &&
    visibleCandidateIds.every((id) => selectedForDelete.has(id));

  const exitEditMode = () => {
    setIsEditing(false);
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

  const deleteSelectedCandidates = async () => {
    const candidateIds = [...selectedForDelete];
    if (candidateIds.length === 0) return;

    await deleteMutation.mutateAsync(candidateIds);

    if (top && candidateIds.includes(top.fittingCandidateId)) {
      clearProduct("TOP");
    }
    if (bottom && candidateIds.includes(bottom.fittingCandidateId)) {
      clearProduct("BOTTOM");
    }

    setSelectedForDelete(new Set());
  };

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasNextPage) return;

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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <>
      <Header
        center={
          <HeaderTitle>{isEditing ? "피팅 편집" : "피팅 목록"}</HeaderTitle>
        }
        left={
          isEditing ? null : (
            <HeaderIconLink aria-label="피팅으로 돌아가기" href="/fitting">
              <BackIcon />
            </HeaderIconLink>
          )
        }
        right={
          <button
            className={styles.editButton}
            onClick={() => (isEditing ? exitEditMode() : setIsEditing(true))}
            type="button"
          >
            {isEditing ? "완료" : "편집"}
          </button>
        }
      />
      <div className={`${styles.screen} ${isEditing ? styles.editing : ""}`}>
        <div className={styles.intro}>
          <h2>
            {isEditing ? "정리할 옷을 골라주세요" : "입어볼 옷을 선택해 주세요"}
          </h2>
          <p>
            {isEditing
              ? "선택한 아이템을 옷장에서 비울 수 있어요."
              : "대화방과 찜 목록에서 담아둔 상품이에요"}
          </p>
        </div>

        <div aria-label="상품 종류" className={styles.filters} role="tablist">
          {FILTERS.map((item) => (
            <button
              aria-selected={filter === item.value}
              className={
                filter === item.value ? styles.activeFilter : undefined
              }
              key={item.value}
              onClick={() => setFilter(item.value)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {isEditing && (
          <button
            aria-pressed={isAllVisibleSelected}
            className={styles.selectAllButton}
            onClick={toggleAllVisible}
            type="button"
          >
            <span className={styles.selectAllMark}>
              {isAllVisibleSelected && <CheckIcon />}
            </span>
            <strong>
              전체 선택 ({selectedForDelete.size}/{totalCount})
            </strong>
            <span>선택 {selectedForDelete.size}개</span>
          </button>
        )}

        <div className={styles.list}>
          {!isEditing && filter !== "ALL" && (
            <EmptyCandidateCard itemType={filter} />
          )}
          {isPending && (
            <p className={styles.stateMessage}>옷장을 불러오고 있어요.</p>
          )}
          {isError && (
            <p className={styles.stateMessage}>옷장을 불러오지 못했어요.</p>
          )}
          {!isPending && !isError && products.length === 0 && (
            <p className={styles.stateMessage}>담아둔 상품이 아직 없어요.</p>
          )}
          {products.map((product) => (
            <CandidateCard
              isEditing={isEditing}
              isSelectedForDelete={selectedForDelete.has(
                product.fittingCandidateId,
              )}
              key={product.fittingCandidateId}
              onToggleDelete={toggleDeleteCandidate}
              product={product}
            />
          ))}
          <div aria-hidden="true" className={styles.loadMore} ref={loadMoreRef}>
            {isFetchingNextPage && "상품을 더 불러오고 있어요."}
          </div>
        </div>

        {isEditing && (
          <div className={styles.deleteNotice}>
            <InfoIcon />
            <p>
              현재 피팅 중인 아이템을 삭제하면?
              <br />
              피팅 캔버스에서는 기본 상품으로 자동 교체됩니다.
            </p>
          </div>
        )}

        <div className={styles.bottomAction}>
          <button
            className={isEditing ? styles.deleteButton : styles.completeButton}
            disabled={
              isEditing &&
              (selectedForDelete.size === 0 || deleteMutation.isPending)
            }
            onClick={() =>
              isEditing
                ? void deleteSelectedCandidates()
                : router.push("/fitting")
            }
            type="button"
          >
            {isEditing ? (
              <>
                <DeleteIcon />
                {deleteMutation.isPending
                  ? "삭제하고 있어요"
                  : `${selectedForDelete.size}개 삭제하기`}
              </>
            ) : (
              `선택 완료 (${selectedCount}/2)`
            )}
          </button>
          {deleteMutation.isError && (
            <p className={styles.deleteError}>상품을 삭제하지 못했어요.</p>
          )}
        </div>
      </div>
    </>
  );
}

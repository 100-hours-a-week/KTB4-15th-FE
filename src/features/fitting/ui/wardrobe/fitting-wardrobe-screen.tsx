"use client";

import { Button } from "@/shared/ui/button";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon, CheckIcon, DeleteIcon, InfoIcon } from "@/shared/ui/icon";
import {
  useFittingWardrobe,
  type WardrobeFilter,
} from "../../hooks/use-fitting-wardrobe";
import type { FittingCandidateListResponse } from "../../schema/fitting-candidate";
import { CandidateCard, EmptyCandidateCard } from "./fitting-wardrobe-card";
import { FittingWardrobeSkeleton } from "./fitting-wardrobe-skeleton";
import styles from "./fitting-wardrobe-screen.module.scss";

type FittingWardrobeScreenProps = {
  initialFilter: WardrobeFilter;
  initialCandidates?: FittingCandidateListResponse;
};

const FILTERS: Array<{ label: string; value: WardrobeFilter }> = [
  { label: "상의", value: "TOP" },
  { label: "하의", value: "BOTTOM" },
  { label: "전체", value: "ALL" },
];

export function FittingWardrobeScreen({
  initialFilter,
  initialCandidates,
}: FittingWardrobeScreenProps) {
  const {
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
    completeSelection,
  } = useFittingWardrobe(initialFilter, initialCandidates);

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
            onClick={toggleEditing}
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
              : "채팅방에서 담아둔 상품이에요"}
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
              onClick={() => changeFilter(item.value)}
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
          {!isEditing &&
            !query.isPending &&
            !isInitialError &&
            products.length > 0 &&
            (filter === "ALL" ? (["TOP", "BOTTOM"] as const) : [filter]).map(
              (itemType) => (
                <EmptyCandidateCard itemType={itemType} key={itemType} />
              ),
            )}
          {query.isPending && <FittingWardrobeSkeleton />}
          {isInitialError && (
            <div className={styles.stateMessage} role="alert">
              <p>옷장을 불러오지 못했어요.</p>
              <Button
                isLoading={query.isFetching}
                onClick={() => void query.refetch()}
                size="small"
                variant="secondary"
              >
                다시 시도
              </Button>
            </div>
          )}
          {!query.isPending && !query.isError && products.length === 0 && (
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
              priority={product.fittingCandidateId === firstImageCandidateId}
            />
          ))}
          <div aria-hidden="true" className={styles.loadMore} ref={loadMoreRef}>
            {query.isFetchingNextPage && "상품을 더 불러오고 있어요."}
          </div>
        </div>

        {isEditing && (
          <div className={styles.deleteNotice}>
            <InfoIcon />
            <p>
              피팅 선택한 상품을 삭제하면
              <br />
              선택 안함으로 자동 변경됩니다.
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
              isEditing ? void deleteSelectedCandidates() : completeSelection()
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

"use client";

import { useRef, useState, type ReactNode } from "react";
import { PaginationStatus } from "@/shared/ui/pagination-status";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/dialog";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon, CheckIcon, DeleteIcon, InfoIcon } from "@/shared/ui/icon";
import {
  useFittingWardrobe,
  type WardrobeFilter,
} from "../../hooks/use-fitting-wardrobe";
import { type FittingCandidateListResponse } from "../../schema/fitting-candidate";
import { CandidateCard } from "./fitting-wardrobe-card";
import {
  EmptyCandidateCard,
  WardrobeSelectionContext,
} from "./fitting-wardrobe-card-actions";
import { FittingWardrobeSkeleton } from "./fitting-wardrobe-skeleton";
import styles from "./fitting-wardrobe-screen.module.scss";

type FittingWardrobeScreenProps = {
  initialFilter: WardrobeFilter;
  initialCandidates?: FittingCandidateListResponse;
  initialCards?: ReactNode;
};

const FILTERS: Array<{ label: string; value: WardrobeFilter }> = [
  { label: "상의", value: "TOP" },
  { label: "하의", value: "BOTTOM" },
  { label: "전체", value: "ALL" },
];

export function FittingWardrobeScreen({
  initialFilter,
  initialCandidates,
  initialCards,
}: FittingWardrobeScreenProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
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
    selectedInFilterCount,
    isAllSelected,
    isSelectingAll,
    selectAllFailed,
    toggleDeleteCandidate,
    toggleAll,
    deleteSelectedCandidates,
    deleteMutation,
    loadMoreRef,
    completeSelection,
  } = useFittingWardrobe(initialFilter, initialCandidates);

  const deleteSummary = FILTERS.filter((item) => item.value !== "ALL")
    .map((item) => {
      const count = [...selectedForDelete.values()].filter(
        (product) => product.itemType === item.value,
      ).length;
      return count > 0 ? `${item.label} ${count}개` : undefined;
    })
    .filter(Boolean)
    .join(" · ");

  const showServerCards =
    initialCards != null &&
    filter === initialFilter &&
    query.data?.pages[0] === initialCandidates;

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
            disabled={isSelectingAll}
            onClick={toggleEditing}
            ref={editButtonRef}
            type="button"
          >
            {isEditing ? "완료" : "편집"}
          </button>
        }
      />
      <main className={`${styles.screen} ${isEditing ? styles.editing : ""}`}>
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

        <div aria-label="상품 종류" className={styles.filters} role="group">
          {FILTERS.map((item) => (
            <button
              aria-pressed={filter === item.value}
              disabled={isSelectingAll}
              className={
                filter === item.value ? styles.activeFilter : undefined
              }
              key={item.value}
              onClick={() => changeFilter(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {isEditing && (
          <>
            <button
              aria-describedby="wardrobe-selected-count"
              aria-disabled={isSelectingAll || totalCount === 0}
              aria-label="전체 선택"
              aria-pressed={isAllSelected}
              className={styles.selectAllButton}
              onClick={() => void toggleAll()}
              type="button"
            >
              <span aria-hidden="true" className={styles.selectAllMark}>
                {isAllSelected && <CheckIcon />}
              </span>
              <strong>전체 선택</strong>
              <span id="wardrobe-selected-count">
                선택 {selectedInFilterCount}개
              </span>
            </button>
            <span className={styles.selectAllStatus} role="status">
              {isSelectingAll && "선택할 상품을 불러오고 있어요."}
            </span>
            {selectAllFailed && (
              <p className={styles.deleteError} role="alert">
                전체 상품을 불러오지 못했어요. 다시 시도해 주세요.
              </p>
            )}
          </>
        )}

        <WardrobeSelectionContext
          value={{
            isEditing,
            isSelectingAll,
            selectedForDelete,
            onToggleDelete: toggleDeleteCandidate,
          }}
        >
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
            {showServerCards && initialCards}
            {products
              .slice(
                showServerCards ? (initialCandidates?.items.length ?? 0) : 0,
              )
              .map((product) => (
                <CandidateCard
                  key={product.fittingCandidateId}
                  product={product}
                  priority={
                    product.fittingCandidateId === firstImageCandidateId
                  }
                />
              ))}
            <div className={styles.loadMore} ref={loadMoreRef}>
              <PaginationStatus
                isLoading={query.isFetchingNextPage}
                isError={query.isFetchNextPageError}
                loadingLabel="상품을 더 불러오고 있어요"
                errorMessage="상품을 더 불러오지 못했어요."
                onRetry={() => void query.fetchNextPage()}
              />
            </div>
          </div>
        </WardrobeSelectionContext>

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
              (isSelectingAll ||
                selectedForDelete.size === 0 ||
                deleteMutation.isPending)
            }
            onClick={() =>
              isEditing ? setIsDeleteOpen(true) : completeSelection()
            }
            ref={deleteButtonRef}
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
        </div>
      </main>
      <ConfirmDialog
        confirmLabel="삭제하기"
        description={
          <>
            {deleteSummary}
            <br />
            삭제한 상품은 옷장에서 사라집니다.
          </>
        }
        isLoading={deleteMutation.isPending}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          (selectedForDelete.size > 0
            ? deleteButtonRef
            : editButtonRef
          ).current?.focus();
        }}
        onConfirm={() => deleteSelectedCandidates(() => setIsDeleteOpen(false))}
        onOpenChange={(open) => {
          if (deleteMutation.isPending) return;
          setIsDeleteOpen(open);
          if (!open) deleteMutation.reset();
        }}
        open={isDeleteOpen}
        title={`선택한 상품 ${selectedForDelete.size}개를 삭제할까요?`}
      >
        {deleteMutation.isError && (
          <p className={styles.deleteError} role="alert">
            상품을 삭제하지 못했어요.
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}

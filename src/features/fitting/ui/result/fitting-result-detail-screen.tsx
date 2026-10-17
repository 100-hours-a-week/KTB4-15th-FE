"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/shared/api/error";
import { Button, IconButton } from "@/shared/ui/button";
import { ConfirmDialog, RenameDialog } from "@/shared/ui/dialog";
import { DeleteIcon, EditIcon, RefreshIcon } from "@/shared/ui/icon";
import { LoadingMessage } from "@/shared/ui/loading-message";
import { showToast } from "@/shared/ui/toast";
import {
  fittingResultDetailQueryOptions,
  useDeleteFittingResultMutation,
  useUpdateFittingResultOutfitNameMutation,
} from "../../model/fitting-query";
import {
  FITTING_OUTFIT_NAME_MAX_LENGTH,
  type FittingResultDetail,
} from "../../schema/fitting-result";
import { FittingResultView } from "./fitting-result-view";
import styles from "./fitting-result-detail-screen.module.scss";

function FittingResultDetailContent({
  fittingResultId,
  result,
}: {
  fittingResultId: number;
  result: FittingResultDetail;
}) {
  const router = useRouter();
  const [outfitName, setOutfitName] = useState(result.outfitName);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const updateFittingResultMutation =
    useUpdateFittingResultOutfitNameMutation();
  const deleteFittingResultMutation = useDeleteFittingResultMutation();

  const handleRename = (nextOutfitName: string) => {
    updateFittingResultMutation.mutate(
      { fittingResultId, request: { outfitName: nextOutfitName } },
      {
        onError: (error) =>
          showToast.error(
            getApiErrorMessage(error, "코디명을 수정하지 못했어요."),
            { id: "update-fitting-result" },
          ),
        onSuccess: () => {
          setOutfitName(nextOutfitName);
          setIsRenameOpen(false);
          showToast.success("코디명을 수정했어요.", {
            id: "update-fitting-result",
          });
        },
      },
    );
  };

  const handleDelete = () => {
    deleteFittingResultMutation.mutate(fittingResultId, {
      onError: (error) =>
        showToast.error(
          getApiErrorMessage(error, "가상 피팅 기록을 삭제하지 못했어요."),
          { id: "delete-fitting-result" },
        ),
      onSuccess: () => {
        showToast.success("가상 피팅 기록을 삭제했어요.", {
          id: "delete-fitting-result",
        });
        router.replace("/fitting-results");
      },
    });
  };

  return (
    <>
      <FittingResultView
        actions={
          <>
            <Link className={styles.primaryLink} href="/fitting">
              <RefreshIcon />
              다른 조합 피팅하기
            </Link>
            <button
              className={styles.deleteButton}
              onClick={() => setIsDeleteOpen(true)}
              type="button"
            >
              <DeleteIcon />이 피팅 기록 삭제
            </button>
          </>
        }
        outfitName={
          <div className={styles.outfitNameField}>
            <span className={styles.outfitNameLabel}>코디명</span>
            <div className={styles.outfitNameDisplay}>
              <span>{outfitName}</span>
              <IconButton
                aria-label="코디명 수정"
                onClick={() => setIsRenameOpen(true)}
                size="small"
                type="button"
              >
                <EditIcon />
              </IconButton>
            </div>
          </div>
        }
        result={result}
        viewTransitionName={`fitting-result-${fittingResultId}`}
      />

      <RenameDialog
        description="저장한 코디를 쉽게 찾을 수 있는 이름을 지어주세요."
        initialValue={outfitName}
        isLoading={updateFittingResultMutation.isPending}
        label="코디명"
        maxLength={FITTING_OUTFIT_NAME_MAX_LENGTH}
        onConfirm={handleRename}
        onOpenChange={setIsRenameOpen}
        open={isRenameOpen}
        title="코디명 변경"
      />
      <ConfirmDialog
        confirmLabel="삭제하기"
        description="삭제한 가상 피팅 결과는 복구할 수 없습니다."
        isLoading={deleteFittingResultMutation.isPending}
        onConfirm={handleDelete}
        onOpenChange={setIsDeleteOpen}
        open={isDeleteOpen}
        title="이 피팅 기록을 삭제할까요?"
      />
    </>
  );
}

export function FittingResultDetailScreen({
  fittingResultId,
}: {
  fittingResultId: number;
}) {
  const query = useQuery(fittingResultDetailQueryOptions(fittingResultId));

  if (query.isPending || query.isError) {
    return (
      <main className={styles.state}>
        {query.isPending ? (
          <LoadingMessage>가상 피팅 결과를 불러오고 있어요</LoadingMessage>
        ) : (
          <div role="alert">
            <p>가상 피팅 결과를 불러오지 못했어요.</p>
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
      </main>
    );
  }

  return (
    <FittingResultDetailContent
      fittingResultId={fittingResultId}
      result={query.data}
    />
  );
}

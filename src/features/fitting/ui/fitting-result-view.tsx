"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { recordPurchaseLinkClick } from "@/features/product";
import { ApiError, getApiErrorMessage } from "@/shared/api/error";
import aiImage from "@/shared/assets/ai-avatar.png";
import { Button, IconButton } from "@/shared/ui/button";
import {
  ConfirmDialog,
  ImageViewerDialog,
  RenameDialog,
} from "@/shared/ui/dialog";
import {
  DeleteIcon,
  EditIcon,
  RefreshIcon,
  SearchIcon,
} from "@/shared/ui/icon";
import { InputField } from "@/shared/ui/input-field";
import { showToast } from "@/shared/ui/toast";
import {
  useCreateFittingResultMutation,
  useDeleteFittingResultMutation,
  useUpdateFittingResultOutfitNameMutation,
} from "../model/fitting-query";
import type { FittingJobStatusResponse } from "../schema/fitting-job";
import {
  FITTING_OUTFIT_NAME_MAX_LENGTH,
  fittingOutfitNameSchema,
  type FittingResultDetail,
} from "../schema/fitting-result";
import styles from "./fitting-result-view.module.scss";

type FittingJobResult = NonNullable<FittingJobStatusResponse["result"]>;

type FittingResultViewProps =
  | {
      fittingJobId: number;
      fittingResultId?: never;
      result: FittingJobResult;
    }
  | {
      fittingJobId?: never;
      fittingResultId: number;
      result: FittingResultDetail;
    };

export function FittingResultView({
  fittingJobId,
  fittingResultId,
  result,
}: FittingResultViewProps) {
  const router = useRouter();
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [outfitName, setOutfitName] = useState(result.outfitName);
  const [nameError, setNameError] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const isDetail = fittingResultId !== undefined;
  const createFittingResultMutation = useCreateFittingResultMutation();
  const updateFittingResultMutation =
    useUpdateFittingResultOutfitNameMutation();
  const deleteFittingResultMutation = useDeleteFittingResultMutation();
  const isSubmitting =
    createFittingResultMutation.isPending ||
    updateFittingResultMutation.isPending;

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedOutfitName = outfitName.trim();

    if (!fittingOutfitNameSchema.safeParse(normalizedOutfitName).success) {
      setNameError("코디명을 1자 이상 입력해 주세요.");
      return;
    }

    setNameError("");
    if (isDetail) return;

    createFittingResultMutation.mutate(
      { fittingJobId, outfitName: normalizedOutfitName },
      {
        onError: (error) => {
          const message =
            error instanceof ApiError &&
            error.code === "FITTING_RESULT_ALREADY_SAVED"
              ? "이미 저장된 가상 피팅 결과예요."
              : getApiErrorMessage(
                  error,
                  "가상 피팅 결과를 저장하지 못했어요.",
                );
          showToast.error(message, { id: "create-fitting-result" });
        },
        onSuccess: () => {
          setOutfitName(normalizedOutfitName);
          setIsSaved(true);
          showToast.success("가상 피팅 결과를 저장했어요.", {
            id: "create-fitting-result",
          });
        },
      },
    );
  };

  const handleRename = (nextOutfitName: string) => {
    if (!isDetail) return;

    updateFittingResultMutation.mutate(
      {
        fittingResultId,
        request: { outfitName: nextOutfitName },
      },
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
    if (!isDetail) return;

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
      <main className={styles.resultMain}>
        <section className={styles.productsSection}>
          <h2>선택한 상품 조합</h2>
          <div className={styles.products}>
            {result.products.map((product) => (
              <a
                aria-label={`${product.productName} 구매 페이지로 이동`}
                className={styles.productCard}
                href={product.purchaseUrl}
                key={product.productId}
                onClick={() => {
                  void recordPurchaseLinkClick(product.productId).catch(
                    () => undefined,
                  );
                }}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className={styles.productImageArea}>
                  <Image
                    alt=""
                    className={styles.productImage}
                    fill
                    sizes="48px"
                    src={product.productImageUrl}
                    unoptimized
                  />
                </span>
                <span>
                  <small>{product.itemType === "TOP" ? "상의" : "하의"}</small>
                  <strong>{product.productName}</strong>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section
          aria-label="가상 피팅 결과 이미지"
          className={styles.resultImageCard}
        >
          <Image
            alt="선택한 상품을 착용한 가상 피팅 결과"
            className={styles.resultImage}
            fill
            loading="eager"
            sizes="(max-width: 480px) calc(100vw - 40px), 320px"
            src={result.resultImageUrl}
            unoptimized
          />
          <button
            aria-label="결과 이미지 확대"
            className={styles.zoomButton}
            onClick={() => setIsImageOpen(true)}
            type="button"
          >
            <SearchIcon />
          </button>
        </section>

        <form className={styles.resultForm} onSubmit={handleSave}>
          {isDetail ? (
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
          ) : (
            <InputField
              className={styles.outfitName}
              disabled={isSubmitting}
              endAdornment={
                <span className={styles.nameLength}>
                  {outfitName.length}/{FITTING_OUTFIT_NAME_MAX_LENGTH}
                </span>
              }
              error={nameError || undefined}
              id="fitting-outfit-name"
              label="코디명"
              maxLength={FITTING_OUTFIT_NAME_MAX_LENGTH}
              onChange={(event) => {
                setOutfitName(
                  event.target.value.slice(0, FITTING_OUTFIT_NAME_MAX_LENGTH),
                );
                setNameError("");
              }}
              readOnly={isSaved}
              reserveHelperSpace={false}
              value={outfitName}
            />
          )}

          <section className={styles.commentCard}>
            <div className={styles.commentHeading}>
              <Image
                alt=""
                aria-hidden="true"
                className={styles.aiAvatar}
                src={aiImage}
              />
              <div>
                <h2>LOOKDDAK&apos;S COMMENT</h2>
                <p>AI 수석 스타일리스트 분석</p>
              </div>
            </div>
            <p className={styles.comment}>{result.comment}</p>
          </section>

          <div className={styles.resultActions}>
            {isDetail ? (
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
            ) : (
              <>
                <Button
                  disabled={isSaved}
                  fullWidth
                  isLoading={createFittingResultMutation.isPending}
                  size="large"
                  type="submit"
                >
                  {isSaved ? "저장 완료" : "가상 피팅 저장"}
                </Button>
                <Link className={styles.retryLink} href="/fitting">
                  <RefreshIcon />
                  다른 조합 피팅하기
                </Link>
              </>
            )}
          </div>
        </form>
      </main>

      <ImageViewerDialog
        alt="선택한 상품을 착용한 가상 피팅 결과 크게 보기"
        onOpenChange={setIsImageOpen}
        open={isImageOpen}
        src={result.resultImageUrl}
      />

      {isDetail && (
        <>
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
      )}
    </>
  );
}

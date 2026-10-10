"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { ApiError, getApiErrorMessage } from "@/shared/api/error";
import { Button } from "@/shared/ui/button";
import { ImageViewerDialog } from "@/shared/ui/dialog";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon, RefreshIcon, SearchIcon } from "@/shared/ui/icon";
import { InputField } from "@/shared/ui/input-field";
import { showToast } from "@/shared/ui/toast";
import { useCreateFittingResultMutation } from "../model/fitting-query";
import type { FittingJobStatusResponse } from "../schema/fitting-job";
import {
  FITTING_OUTFIT_NAME_MAX_LENGTH,
  fittingOutfitNameSchema,
} from "../schema/fitting-result";
import styles from "./fitting-result-view.module.scss";

type FittingResult = NonNullable<FittingJobStatusResponse["result"]>;

export function FittingResultView({
  fittingJobId,
  result,
}: {
  fittingJobId: number;
  result: FittingResult;
}) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [outfitName, setOutfitName] = useState(result.outfitName);
  const [nameError, setNameError] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const createFittingResultMutation = useCreateFittingResultMutation();

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedOutfitName = outfitName.trim();

    if (!fittingOutfitNameSchema.safeParse(normalizedOutfitName).success) {
      setNameError("코디명을 1자 이상 입력해 주세요.");
      return;
    }

    setNameError("");
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

  return (
    <>
      <Header
        center={<HeaderTitle>가상 피팅 결과</HeaderTitle>}
        left={
          <HeaderIconLink aria-label="피팅으로 돌아가기" href="/fitting">
            <BackIcon />
          </HeaderIconLink>
        }
      />
      <main className={styles.resultMain}>
        <section className={styles.productsSection}>
          <h2>선택한 상품 조합</h2>
          <div className={styles.products}>
            {result.products.map((product) => (
              <article className={styles.productCard} key={product.productId}>
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
              </article>
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
          <InputField
            className={styles.outfitName}
            disabled={createFittingResultMutation.isPending}
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

          <section className={styles.commentCard}>
            <div className={styles.commentHeading}>
              <span className={styles.aiAvatar}>AI</span>
              <div>
                <h2>LOOKDDAK&apos;S COMMENT</h2>
                <p>AI 수석 스타일리스트 분석</p>
              </div>
            </div>
            <p className={styles.comment}>{result.comment}</p>
          </section>

          <div className={styles.resultActions}>
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
          </div>
        </form>
      </main>

      <ImageViewerDialog
        alt="선택한 상품을 착용한 가상 피팅 결과 크게 보기"
        onOpenChange={setIsImageOpen}
        open={isImageOpen}
        src={result.resultImageUrl}
      />
    </>
  );
}

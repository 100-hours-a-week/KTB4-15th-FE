"use client";

import Image from "next/image";
import { type ReactNode, useState } from "react";
import { recordPurchaseLinkClick } from "@/features/product";
import aiImage from "@/shared/assets/ai-avatar.png";
import { ImageViewerDialog } from "@/shared/ui/dialog";
import { SearchIcon } from "@/shared/ui/icon";
import type { FittingTempResult } from "../../schema/fitting-job";
import type { FittingResultDetail } from "../../schema/fitting-result";
import { FittingProductCombination } from "../fitting-product-combination";
import styles from "./fitting-result-view.module.scss";

type FittingResultViewProps = {
  actions: ReactNode;
  outfitName: ReactNode;
  result: FittingTempResult | FittingResultDetail;
};

export function FittingResultView({
  actions,
  outfitName,
  result,
}: FittingResultViewProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <>
      <main className={styles.resultMain}>
        <FittingProductCombination
          onProductClick={(productId) => {
            void recordPurchaseLinkClick(productId).catch(() => undefined);
          }}
          products={result.products}
        />

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

        <div className={styles.resultForm}>
          {outfitName}

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
            <p className={styles.comment}>
              {result.comment ?? "코디 설명이 제공되지 않았어요."}
            </p>
          </section>

          <div className={styles.resultActions}>{actions}</div>
        </div>
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

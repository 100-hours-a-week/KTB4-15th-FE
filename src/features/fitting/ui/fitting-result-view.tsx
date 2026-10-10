"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImageViewerDialog } from "@/shared/ui/dialog";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon, RefreshIcon, SearchIcon } from "@/shared/ui/icon";
import type { FittingJobStatusResponse } from "../schema/fitting-job";
import styles from "./fitting-job-screen.module.scss";

type FittingResult = NonNullable<FittingJobStatusResponse["result"]>;

export function FittingResultView({ result }: { result: FittingResult }) {
  const [isImageOpen, setIsImageOpen] = useState(false);

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

        <section className={styles.nameCard}>
          <div className={styles.nameHeading}>
            <label htmlFor="fitting-outfit-name">코디명</label>
            <span>{result.outfitName.length}/20</span>
          </div>
          <input
            className={styles.outfitName}
            id="fitting-outfit-name"
            maxLength={20}
            readOnly
            value={result.outfitName}
          />
        </section>

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
          <Link className={styles.retryLink} href="/fitting">
            <RefreshIcon />
            다른 조합 피팅하기
          </Link>
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

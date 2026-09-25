"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMemberProfileQuery } from "@/features/profile/api/member-profile-query";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon, CloseIcon, RefreshIcon, SearchIcon } from "@/shared/ui/icon";
import { useFittingJobStatusQuery } from "../api/fitting-job-query";
import { clearActiveFittingJobId } from "../model/active-fitting-job-storage";
import type { FittingJobStatusResponse } from "../schema/fitting-job";
import styles from "./fitting-job-screen.module.scss";

type FittingJobScreenProps = {
  fittingJobId: number;
};

type FittingResult = NonNullable<FittingJobStatusResponse["result"]>;

function ResultHeader() {
  return (
    <Header
      center={<HeaderTitle>가상 피팅 결과</HeaderTitle>}
      left={
        <HeaderIconLink aria-label="피팅으로 돌아가기" href="/fitting">
          <BackIcon />
        </HeaderIconLink>
      }
    />
  );
}

function ProgressHeader() {
  return (
    <Header
      center={<HeaderTitle>가상 피팅</HeaderTitle>}
      left={
        <HeaderIconLink aria-label="피팅으로 돌아가기" href="/fitting">
          <BackIcon />
        </HeaderIconLink>
      }
    />
  );
}

function FittingResultView({ result }: { result: FittingResult }) {
  const { data: memberProfile } = useMemberProfileQuery();
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [outfitName, setOutfitName] = useState(result.outfitName);

  useEffect(() => {
    if (!isImageOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsImageOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageOpen]);

  return (
    <>
      <ResultHeader />
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
            priority
            sizes="(max-width: 480px) calc(100vw - 40px), 440px"
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
          {memberProfile && (
            <span className={styles.bodyBadge}>
              {memberProfile.height}cm · {memberProfile.weight}kg 체형 기준 핏
              매칭
            </span>
          )}
        </section>

        <section className={styles.nameCard}>
          <div className={styles.nameHeading}>
            <label htmlFor="fitting-outfit-name">코디명</label>
            <span>{outfitName.length}/20</span>
          </div>
          <input
            className={styles.outfitName}
            id="fitting-outfit-name"
            maxLength={20}
            onChange={(event) => setOutfitName(event.target.value)}
            value={outfitName}
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
          {/* <Button fullWidth size="large">
            가상 피팅 저장 목록에 저장
          </Button> */}
          <Link className={styles.retryLink} href="/fitting">
            <RefreshIcon />
            다른 조합 피팅하기
          </Link>
        </div>
      </main>

      {isImageOpen && (
        <div
          aria-label="가상 피팅 결과 이미지 크게 보기"
          aria-modal="true"
          className={styles.imageViewer}
          onClick={() => setIsImageOpen(false)}
          role="dialog"
        >
          <button
            aria-label="이미지 크게 보기 닫기"
            className={styles.imageViewerClose}
            onClick={() => setIsImageOpen(false)}
            type="button"
          >
            <CloseIcon />
          </button>
          <div
            className={styles.imageViewerContent}
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              alt="선택한 상품을 착용한 가상 피팅 결과 크게 보기"
              className={styles.imageViewerImage}
              fill
              priority
              sizes="100vw"
              src={result.resultImageUrl}
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  );
}

export function FittingJobScreen({ fittingJobId }: FittingJobScreenProps) {
  const { data, isError, isPending } = useFittingJobStatusQuery(fittingJobId);

  useEffect(() => {
    if (data?.status === "COMPLETED" || data?.status === "FAILED") {
      clearActiveFittingJobId(fittingJobId);
    }
  }, [data?.status, fittingJobId]);

  if (isPending) {
    return (
      <>
        <ProgressHeader />
        <main className={styles.main}>
          <p>피팅 작업 상태를 확인하고 있어요.</p>
        </main>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <ProgressHeader />
        <main className={styles.main}>
          <h2>피팅 작업을 확인하지 못했어요</h2>
          <p>잠시 후 다시 시도해 주세요.</p>
        </main>
      </>
    );
  }

  if (data.status === "FAILED") {
    return (
      <>
        <ProgressHeader />
        <main className={styles.main}>
          <h2>가상 피팅 생성에 실패했어요</h2>
          <p>피팅 홈에서 다시 시도해 주세요.</p>
        </main>
      </>
    );
  }

  if (data.status === "COMPLETED" && data.result) {
    return <FittingResultView result={data.result} />;
  }

  return (
    <>
      <ProgressHeader />
      <main className={styles.main}>
        <p className={styles.eyebrow}>FITTING #{fittingJobId}</p>
        <h2>가상 피팅을 준비하고 있어요</h2>
        <p>결과가 준비될 때까지 잠시만 기다려 주세요.</p>
      </main>
    </>
  );
}

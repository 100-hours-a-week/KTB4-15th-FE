"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { memberProfileQueryOptions } from "@/features/profile";
import { Button } from "@/shared/ui/button";
import { Header, HeaderIconLink, HeaderTitle } from "@/shared/ui/header";
import { BackIcon, CloseIcon, RefreshIcon, SearchIcon } from "@/shared/ui/icon";
import { fittingJobQueryOptions } from "../model/fitting-query";
import { clearActiveFittingJobId } from "../store/active-fitting-job-storage";
import {
  clearFittingJobProgress,
  getFittingJobStartedAt,
} from "../store/fitting-job-progress-storage";
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
  return <Header center={<HeaderTitle>가상 피팅</HeaderTitle>} />;
}

const MAX_SIMULATED_PROGRESS = 92;
const RESULT_REVEAL_DELAY = 900;

function getSimulatedProgress(createdAt: number) {
  const elapsedSeconds = Math.max(0, Date.now() - createdAt) / 1000;

  return Math.min(
    MAX_SIMULATED_PROGRESS,
    Math.round(10 + 84 * (1 - Math.exp(-elapsedSeconds / 14))),
  );
}

function FittingProgressView({
  completed,
  fittingJobId,
}: {
  completed: boolean;
  fittingJobId: number;
}) {
  const { data: memberProfile } = useQuery(memberProfileQueryOptions);
  const [startedAt] = useState(() => getFittingJobStartedAt(fittingJobId));
  const [progress, setProgress] = useState(() =>
    getSimulatedProgress(startedAt ?? Date.now()),
  );

  useEffect(() => {
    if (completed) {
      const frame = window.requestAnimationFrame(() => setProgress(100));
      return () => window.cancelAnimationFrame(frame);
    }

    const timer = window.setInterval(() => {
      setProgress(getSimulatedProgress(startedAt ?? Date.now()));
    }, 500);

    return () => window.clearInterval(timer);
  }, [completed, startedAt]);

  return (
    <>
      <ProgressHeader />
      <main className={styles.progressMain}>
        <div aria-hidden="true" className={styles.floatingVisual}>
          <Image
            alt=""
            className={styles.floatingImage}
            height={220}
            loading="eager"
            src="/images/fitting-loading.png"
            width={220}
          />
        </div>

        <section className={styles.progressCopy}>
          <h2>
            {memberProfile?.name
              ? `${memberProfile.name} 님의 체형에 맞춰`
              : "체형에 맞춰"}
            <br />
            자연스러운 핏을 짓고 있어요
          </h2>
          <p>
            원단의 텍스처와 실루엣을 계산 중이에요.
            <br />
            잠시만 기다려주세요.
          </p>
        </section>

        <section
          aria-label="피팅 이미지 생성 진행률"
          className={styles.progressStatus}
        >
          <div className={styles.progressMeta}>
            <span>피팅 이미지를 완성하고 있어요</span>
            <strong>{progress}%</strong>
          </div>
          <div
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className={styles.progressTrack}
            role="progressbar"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </section>

        <aside className={styles.tipCard}>
          <span aria-hidden="true" className={styles.tipIcon}>
            💡
          </span>
          <div>
            <p>
              피팅 꿀팁 <small>LOOKDDAK Tip</small>
            </p>
            <span>가상 피팅된 조합은 저장이 가능해질 예정입니다.</span>
          </div>
        </aside>

        <Link className={styles.backgroundAction} href="/chat">
          다른 코디 둘러보며 기다리기
          <span aria-hidden="true">›</span>
        </Link>
      </main>
    </>
  );
}

function FittingResultView({ result }: { result: FittingResult }) {
  const { data: memberProfile } = useQuery(memberProfileQueryOptions);
  const [isImageOpen, setIsImageOpen] = useState(false);

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
            loading="eager"
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
              loading="eager"
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
  const router = useRouter();
  const { data, isError, isPending } = useQuery(
    fittingJobQueryOptions(fittingJobId),
  );
  const [isResultReady, setIsResultReady] = useState(false);

  const handleReturnToFitting = () => {
    clearActiveFittingJobId(fittingJobId);
    clearFittingJobProgress(fittingJobId);
    router.replace("/fitting");
  };

  useEffect(() => {
    if (data?.status === "FAILED") {
      clearActiveFittingJobId(fittingJobId);
      clearFittingJobProgress(fittingJobId);
    }
  }, [data?.status, fittingJobId]);

  useEffect(() => {
    if (data?.status !== "COMPLETED") return;

    clearActiveFittingJobId(fittingJobId);
    const timer = window.setTimeout(() => {
      setIsResultReady(true);
      clearFittingJobProgress(fittingJobId);
    }, RESULT_REVEAL_DELAY);

    return () => window.clearTimeout(timer);
  }, [data?.status, fittingJobId]);

  if (isPending) {
    return (
      <FittingProgressView completed={false} fittingJobId={fittingJobId} />
    );
  }

  if (isError) {
    return (
      <>
        <ProgressHeader />
        <main className={styles.main}>
          <h2>피팅 작업을 확인하지 못했어요</h2>
          <p>잠시 후 다시 시도해 주세요.</p>
          <Button
            className={styles.recoveryButton}
            onClick={handleReturnToFitting}
          >
            피팅 홈으로 이동
          </Button>
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
          <Button
            className={styles.recoveryButton}
            onClick={handleReturnToFitting}
          >
            피팅 홈으로 이동
          </Button>
        </main>
      </>
    );
  }

  if (data.status === "COMPLETED" && data.result && isResultReady) {
    return <FittingResultView result={data.result} />;
  }

  return (
    <FittingProgressView
      completed={data.status === "COMPLETED"}
      fittingJobId={fittingJobId}
    />
  );
}

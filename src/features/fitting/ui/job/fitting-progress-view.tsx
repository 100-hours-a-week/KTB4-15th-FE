"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { memberProfileQueryOptions } from "@/features/profile";
import { Header, HeaderTitle } from "@/shared/ui/header";
import { currentFittingJobQueryOptions } from "../../model/fitting-query";
import { getFittingJobStartedAt } from "../../store/fitting-job-progress-storage";
import { FittingProductCombination } from "../fitting-product-combination";
import styles from "./fitting-progress-view.module.scss";

const MAX_SIMULATED_PROGRESS = 92;
const FITTING_TIPS = [
  "피팅 요청은 한 번에 하나만 진행할 수 있어요.",
  "저장한 가상 피팅은 코디명을 변경할 수 있어요.",
  "피팅이 진행되는 동안 다른 코디를 둘러볼 수 있어요.",
];

function getSimulatedProgress(createdAt: number) {
  const elapsedSeconds = Math.max(0, Date.now() - createdAt) / 1000;

  return Math.min(
    MAX_SIMULATED_PROGRESS,
    Math.round(10 + 84 * (1 - Math.exp(-elapsedSeconds / 14))),
  );
}

function getProgressMessage(progress: number) {
  if (progress < 35) return "선택한 옷을 살펴보고 있어요";
  if (progress < 70) return "체형에 맞게 핏을 조정하고 있어요";
  if (progress < 100) return "피팅 이미지를 완성하고 있어요";

  return "완성된 피팅을 불러오고 있어요";
}

export function FittingProgressView({
  completed,
  fittingJobId,
}: {
  completed: boolean;
  fittingJobId: number;
}) {
  const { data: memberProfile } = useQuery(memberProfileQueryOptions);
  const { data: currentFittingJob } = useQuery(currentFittingJobQueryOptions);
  const [startedAt] = useState(() => getFittingJobStartedAt(fittingJobId));
  const [progress, setProgress] = useState(() =>
    getSimulatedProgress(startedAt ?? Date.now()),
  );
  const products =
    currentFittingJob?.fittingJobId === fittingJobId
      ? currentFittingJob.products
      : [];
  const progressMessage = getProgressMessage(progress);
  const fittingTip = FITTING_TIPS[fittingJobId % FITTING_TIPS.length];

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
      <Header center={<HeaderTitle>가상 피팅</HeaderTitle>} />
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
        </section>

        <section
          aria-label="피팅 이미지 생성 진행률"
          className={styles.progressStatus}
        >
          <div className={styles.progressMeta}>
            <span>{progressMessage}</span>
            <strong>{progress}%</strong>
          </div>
          <div
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            aria-valuetext={progressMessage}
            className={styles.progressTrack}
            role="progressbar"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </section>

        {products.length > 0 && (
          <div className={styles.productsArea}>
            <FittingProductCombination compact products={products} />
          </div>
        )}

        <aside className={styles.tipCard}>
          <span aria-hidden="true" className={styles.tipIcon}>
            💡
          </span>
          <div>
            <p>피팅 꿀팁</p>
            <span>{fittingTip}</span>
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { memberProfileQueryOptions } from "@/features/profile";
import { Header, HeaderTitle } from "@/shared/ui/header";
import { getFittingJobStartedAt } from "../store/fitting-job-progress-storage";
import styles from "./fitting-job-screen.module.scss";

const MAX_SIMULATED_PROGRESS = 92;

function getSimulatedProgress(createdAt: number) {
  const elapsedSeconds = Math.max(0, Date.now() - createdAt) / 1000;

  return Math.min(
    MAX_SIMULATED_PROGRESS,
    Math.round(10 + 84 * (1 - Math.exp(-elapsedSeconds / 14))),
  );
}

export function FittingProgressView({
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

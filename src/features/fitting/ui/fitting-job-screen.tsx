"use client";

import { useEffect } from "react";
import { useFittingJobStatusQuery } from "../api/fitting-job-query";
import { clearActiveFittingJobId } from "../model/active-fitting-job-storage";
import styles from "./fitting-job-screen.module.scss";

type FittingJobScreenProps = {
  fittingJobId: number;
};

export function FittingJobScreen({ fittingJobId }: FittingJobScreenProps) {
  const { data, isError, isPending } = useFittingJobStatusQuery(fittingJobId);

  useEffect(() => {
    if (data?.status === "COMPLETED" || data?.status === "FAILED") {
      clearActiveFittingJobId(fittingJobId);
    }
  }, [data?.status, fittingJobId]);

  if (isPending) {
    return (
      <main className={styles.main}>
        <p>피팅 작업 상태를 확인하고 있어요.</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className={styles.main}>
        <h2>피팅 작업을 확인하지 못했어요</h2>
        <p>잠시 후 다시 시도해 주세요.</p>
      </main>
    );
  }

  if (data.status === "FAILED") {
    return (
      <main className={styles.main}>
        <h2>가상 피팅 생성에 실패했어요</h2>
        <p>피팅 홈에서 다시 시도해 주세요.</p>
      </main>
    );
  }

  if (data.status === "COMPLETED" && data.result) {
    return (
      <main className={styles.main}>
        <p className={styles.eyebrow}>FITTING #{fittingJobId}</p>
        <h2>{data.result.outfitName}</h2>
        <p>{data.result.comment}</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <p className={styles.eyebrow}>FITTING #{fittingJobId}</p>
      <h2>가상 피팅을 준비하고 있어요</h2>
      <p>결과가 준비될 때까지 잠시만 기다려 주세요.</p>
    </main>
  );
}

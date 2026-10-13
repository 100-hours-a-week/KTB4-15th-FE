"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Header, HeaderTitle } from "@/shared/ui/header";
import { fittingJobQueryOptions } from "../../model/fitting-query";
import { clearActiveFittingJobId } from "../../store/active-fitting-job-storage";
import { clearFittingJobProgress } from "../../store/fitting-job-progress-storage";
import { FittingProgressView } from "./fitting-progress-view";
import styles from "./fitting-job-screen.module.scss";

type FittingJobScreenProps = {
  fittingJobId: number;
};

function ProgressHeader() {
  return <Header center={<HeaderTitle>가상 피팅</HeaderTitle>} />;
}

const RESULT_REVEAL_DELAY = 900;

export function FittingJobScreen({ fittingJobId }: FittingJobScreenProps) {
  const router = useRouter();
  const { data, isError, isPending } = useQuery(
    fittingJobQueryOptions(fittingJobId),
  );

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
      clearFittingJobProgress(fittingJobId);
      router.replace(`/fitting/jobs/${fittingJobId}/result`);
    }, RESULT_REVEAL_DELAY);

    return () => window.clearTimeout(timer);
  }, [data?.status, fittingJobId, router]);

  if (isPending) {
    return (
      <FittingProgressView completed={false} fittingJobId={fittingJobId} />
    );
  }

  if (isError) {
    return (
      <>
        <ProgressHeader />
        <main className={styles.errorMain}>
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
        <main className={styles.errorMain}>
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

  return (
    <FittingProgressView
      completed={data.status === "COMPLETED"}
      fittingJobId={fittingJobId}
    />
  );
}

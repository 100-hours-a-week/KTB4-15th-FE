"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/shared/api/error";
import { Button } from "@/shared/ui/button";
import { Header, HeaderTitle } from "@/shared/ui/header";
import { showToast } from "@/shared/ui/toast";
import {
  fittingJobQueryOptions,
  useMarkFittingResultViewedMutation,
} from "../../model/fitting-query";
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
  const markViewedMutation = useMarkFittingResultViewedMutation();

  const handleReturnToFitting = async () => {
    if (data?.fittingJobId === fittingJobId && data.status === "FAILED") {
      try {
        await markViewedMutation.mutateAsync(fittingJobId);
      } catch (error) {
        showToast.error(
          getApiErrorMessage(error, "실패한 피팅 작업을 정리하지 못했어요."),
          { id: "mark-failed-fitting-viewed" },
        );
        return;
      }
    }

    router.replace("/fitting");
  };

  useEffect(() => {
    if (data?.fittingJobId !== fittingJobId || data.status !== "COMPLETED") {
      return;
    }

    const timer = window.setTimeout(() => {
      router.replace(`/fitting/jobs/${fittingJobId}/result`);
    }, RESULT_REVEAL_DELAY);

    return () => window.clearTimeout(timer);
  }, [data, fittingJobId, router]);

  if (isPending) {
    return <FittingProgressView fittingJobId={fittingJobId} />;
  }

  if (isError || !data || data.fittingJobId !== fittingJobId) {
    return (
      <>
        <ProgressHeader />
        <main className={styles.errorMain}>
          <h2>피팅 작업을 확인하지 못했어요</h2>
          <p>잠시 후 다시 시도해 주세요.</p>
          <Button
            className={styles.recoveryButton}
            onClick={() => void handleReturnToFitting()}
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
            isLoading={markViewedMutation.isPending}
            onClick={() => void handleReturnToFitting()}
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
      createdAt={data.createdAt}
      fittingJobId={fittingJobId}
    />
  );
}

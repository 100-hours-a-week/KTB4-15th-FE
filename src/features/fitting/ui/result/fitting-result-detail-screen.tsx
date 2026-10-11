"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { LoadingMessage } from "@/shared/ui/loading-message";
import { fittingResultDetailQueryOptions } from "../../model/fitting-query";
import { FittingResultView } from "./fitting-result-view";
import styles from "./fitting-result-detail-screen.module.scss";

export function FittingResultDetailScreen({
  fittingResultId,
}: {
  fittingResultId: number;
}) {
  const query = useQuery(fittingResultDetailQueryOptions(fittingResultId));

  if (query.isPending || query.isError) {
    return (
      <main className={styles.state}>
        {query.isPending ? (
          <LoadingMessage>가상 피팅 결과를 불러오고 있어요</LoadingMessage>
        ) : (
          <div role="alert">
            <p>가상 피팅 결과를 불러오지 못했어요.</p>
            <Button
              isLoading={query.isFetching}
              onClick={() => void query.refetch()}
              size="small"
              variant="secondary"
            >
              다시 시도
            </Button>
          </div>
        )}
      </main>
    );
  }

  return (
    <FittingResultView fittingResultId={fittingResultId} result={query.data} />
  );
}

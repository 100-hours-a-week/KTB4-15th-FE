"use client";

import Image, { type ImageLoaderProps } from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { LoadingMessage } from "@/shared/ui/loading-message";
import { formatKoreanNumericDateTime } from "@/shared/utils/date-format";
import { fittingResultListQueryOptions } from "../model/fitting-query";
import styles from "./fitting-result-list-screen.module.scss";

function passthroughImageLoader({ src }: ImageLoaderProps) {
  return src;
}

export function FittingResultListScreen() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isPending,
    refetch,
  } = useInfiniteQuery(fittingResultListQueryOptions);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const results = data?.pages.flatMap((page) => page.items) ?? [];
  const isInitialError = isError && data == null;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <main className={styles.screen}>
      {isPending && (
        <LoadingMessage className={styles.state}>
          저장 목록을 불러오고 있어요
        </LoadingMessage>
      )}
      {isInitialError && (
        <div className={styles.state} role="alert">
          <p>저장 목록을 불러오지 못했어요.</p>
          <Button
            isLoading={isFetching}
            onClick={() => void refetch()}
            size="small"
            variant="secondary"
          >
            다시 시도
          </Button>
        </div>
      )}
      {!isPending && !isInitialError && results.length === 0 && (
        <p className={styles.state}>저장한 가상 피팅 결과가 아직 없어요.</p>
      )}
      {results.length > 0 && (
        <div className={styles.list}>
          {results.map((result) => (
            <Link
              aria-label={`${result.outfitName} 상세 보기`}
              className={styles.card}
              href={`/fitting-results/${result.fittingResultId}`}
              key={result.fittingResultId}
            >
              <div className={styles.imageArea}>
                <Image
                  alt={`${result.outfitName} 가상 피팅 결과`}
                  className={styles.image}
                  fill
                  loader={passthroughImageLoader}
                  sizes="(max-width: 520px) calc(100vw - 40px), 480px"
                  src={result.resultImageUrl}
                />
              </div>
              <div className={styles.cardBody}>
                <time dateTime={result.savedAt}>
                  {formatKoreanNumericDateTime(result.savedAt)}
                </time>
                <h3>{result.outfitName}</h3>
              </div>
            </Link>
          ))}
          <div className={styles.loadMore} ref={loadMoreRef}>
            {isFetchingNextPage && "저장 목록을 더 불러오고 있어요."}
            {isError && data && (
              <Button
                isLoading={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
                size="small"
                variant="secondary"
              >
                다시 시도
              </Button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

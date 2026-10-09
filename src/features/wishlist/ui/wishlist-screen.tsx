"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { LoadingMessage } from "@/shared/ui/loading-message";
import { wishlistListQueryOptions } from "../model/wishlist-query";
import { WishlistCard } from "./wishlist-card";
import styles from "./wishlist-screen.module.scss";

export function WishlistScreen() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isPending,
    refetch,
  } = useInfiniteQuery(wishlistListQueryOptions);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;
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
    <>
      <main className={styles.screen}>
        {isPending && (
          <LoadingMessage className={styles.state}>
            찜 목록을 불러오고 있어요
          </LoadingMessage>
        )}
        {isInitialError && (
          <div className={styles.state} role="alert">
            <p>찜 목록을 불러오지 못했어요.</p>
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
        {!isPending && !isInitialError && products.length === 0 && (
          <div className={styles.empty}>
            <p>찜 목록이 비어있어요.</p>
          </div>
        )}
        {products.length > 0 && (
          <>
            <p className={styles.count}>전체 {totalCount.toLocaleString()}개</p>
            <div className={styles.list}>
              {products.map((product) => (
                <WishlistCard key={product.wishlistId} product={product} />
              ))}
              <div className={styles.loadMore} ref={loadMoreRef}>
                {isFetchingNextPage && "찜 목록을 더 불러오고 있어요."}
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
          </>
        )}
      </main>
    </>
  );
}
